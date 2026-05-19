#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.14 — Founder-to-org messaging smoke.
 *
 * Two parts:
 *   1. Always-on (no DB / no network). Asserts the controller is exported
 *      and that the synchronous validation branches return 400 without
 *      touching the database.
 *   2. Opt-in HTTP smoke (`RUN_FOUNDER_TO_ORG_HTTP=1`, needs Mongo). Drives
 *      the real endpoint and asserts auth gating, no-admin handling, and
 *      the fan-out + notification behaviour.
 *
 * Run from server/:
 *   node scripts/step_2_14_founder_to_org_smoke.mjs
 *   RUN_FOUNDER_TO_ORG_HTTP=1 node scripts/step_2_14_founder_to_org_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

if (!process.env.EMAIL_DRIVER) process.env.EMAIL_DRIVER = "log";

// ---- Part 1: controller surface + body validation (no DB) ----------------

{
  const ctrl = await import("../src/controllers/messages.controller.js");
  assert.equal(
    typeof ctrl.sendFounderToOrg,
    "function",
    "sendFounderToOrg is exported",
  );

  function makeRes() {
    return {
      statusCode: 200,
      body: null,
      req: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
  }

  // Missing organizationId -> 400 (synchronous, no DB).
  {
    const res = makeRes();
    await ctrl.sendFounderToOrg(
      { user: { id: "anyone" }, body: { body: "hi" } },
      res,
    );
    assert.equal(res.statusCode, 400, "missing org -> 400");
    assert.match(res.body?.message || "", /organizationId/i);
  }

  // organizationId present but empty body + no attachments -> 400 +
  // MESSAGE_BODY_REQUIRED, synchronous (the next check would hit DB, so we
  // pass a valid ObjectId but leave body empty).
  {
    const res = makeRes();
    const mongoose = (await import("mongoose")).default;
    await ctrl.sendFounderToOrg(
      {
        user: { id: "anyone" },
        body: { organizationId: new mongoose.Types.ObjectId().toString() },
      },
      res,
    );
    assert.equal(res.statusCode, 400, "empty body -> 400");
    assert.equal(res.body?.code, "MESSAGE_BODY_REQUIRED");
  }
}

console.log("Part 1: founder-to-org controller surface PASSED");

// ---- Part 2: HTTP integration smoke (opt-in) ------------------------------

if (process.env.RUN_FOUNDER_TO_ORG_HTTP !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_FOUNDER_TO_ORG_HTTP=1 and Mongo env to run).",
  );
  process.exit(0);
}

const request = (await import("supertest")).default;
const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const Organization = (await import("../src/models/Organization.js")).default;
const OrganizationAdmin = (await import("../src/models/OrganizationAdmin.js"))
  .default;
const Cohort = (await import("../src/models/Cohort.js")).default;
const CohortMembership = (await import("../src/models/CohortMembership.js"))
  .default;
const Startup = (await import("../src/models/Startup.js")).default;
const Message = (await import("../src/models/Message.js")).default;
const Notification = (await import("../src/models/Notification.js")).default;

await connectDatabase();

async function signup(role) {
  const email = `f2o_${role}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `F2O ${role}`,
    email,
    password: "F2OPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role} should 201`);
  return {
    token: res.body?.data?.token,
    userId: String(res.body?.data?.user?._id ?? res.body?.data?.user?.id),
    email,
  };
}

const admin1 = await signup("organization");
const admin2 = await signup("organization");
const org = await Organization.create({
  name: `F2O Org ${Date.now()}`,
  createdBy: admin1.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: admin1.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: admin2.userId,
});
const cohort = await Cohort.create({
  name: `F2O Cohort ${Date.now()}`,
  organizationId: org._id,
  createdBy: admin1.userId,
});

const founder = await signup("founder");
const startup = await Startup.create({
  name: `F2O Startup ${Date.now()}`,
  founderId: founder.userId,
});
await CohortMembership.create({
  cohortId: cohort._id,
  startupId: startup._id,
  founderId: founder.userId,
  status: "active",
  joinedAt: new Date(),
});

// --- 403 NOT_A_COHORT_MEMBER: stranger tries to message the org ---
{
  const stranger = await signup("founder");
  const res = await request(app)
    .post("/api/v1/messages/founder-to-org")
    .set("Authorization", `Bearer ${stranger.token}`)
    .send({
      organizationId: String(org._id),
      subject: "hi",
      body: "I'm not a member",
    });
  assert.equal(res.status, 403, "stranger -> 403");
  assert.equal(res.body?.code, "NOT_A_COHORT_MEMBER");
}

// --- 400 MESSAGE_BODY_REQUIRED via real HTTP path ---
{
  const res = await request(app)
    .post("/api/v1/messages/founder-to-org")
    .set("Authorization", `Bearer ${founder.token}`)
    .send({ organizationId: String(org._id), subject: "no body" });
  assert.equal(res.status, 400, "empty body -> 400");
  assert.equal(res.body?.code, "MESSAGE_BODY_REQUIRED");
}

// --- 201 happy path: 2 Message rows + 2 Notifications ---
let broadcastId;
{
  const res = await request(app)
    .post("/api/v1/messages/founder-to-org")
    .set("Authorization", `Bearer ${founder.token}`)
    .send({
      organizationId: String(org._id),
      cohortId: String(cohort._id),
      subject: "Hello team",
      body: "Hi accelerator!",
    });
  assert.equal(res.status, 201, "happy path -> 201");
  assert.equal(res.body?.data?.count, 2, "fanned out to 2 admins");
  broadcastId = res.body?.data?.broadcastId;
  assert.ok(broadcastId, "broadcastId returned");
}

// give the fire-and-forget notification a beat to land
await new Promise((r) => setTimeout(r, 500));

{
  const msgs = await Message.find({
    organizationId: org._id,
    "metadata.broadcastId": broadcastId,
  }).lean();
  assert.equal(msgs.length, 2, "2 Message rows persisted");
  const recipients = new Set(msgs.map((m) => String(m.toUserId)));
  assert.ok(recipients.has(admin1.userId), "admin1 has a row");
  assert.ok(recipients.has(admin2.userId), "admin2 has a row");
  for (const m of msgs) {
    assert.equal(m.messageType, "dm", "messageType is 'dm'");
    assert.equal(m.metadata?.kind, "founder-to-org");
  }
}

{
  const notifs = await Notification.find({
    type: "founder-message",
    "metadata.broadcastId": broadcastId,
  }).lean();
  assert.equal(notifs.length, 2, "2 founder-message notifications");
}

// --- 422 ORG_HAS_NO_ADMINS: clear admins and re-post ---
await OrganizationAdmin.deleteMany({ organizationId: org._id });
{
  const res = await request(app)
    .post("/api/v1/messages/founder-to-org")
    .set("Authorization", `Bearer ${founder.token}`)
    .send({
      organizationId: String(org._id),
      subject: "knock knock",
      body: "anybody home?",
    });
  assert.equal(res.status, 422, "no admins -> 422");
  assert.equal(res.body?.code, "ORG_HAS_NO_ADMINS");
}

await mongoose.disconnect();
console.log("Part 2: HTTP founder-to-org smoke PASSED");
