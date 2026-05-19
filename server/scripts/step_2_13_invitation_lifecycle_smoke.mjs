#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.13 — Cancel / resend / cancelled-respond lifecycle smoke.
 *
 * Two parts:
 *   1. Always-on (no DB / no network). Asserts the controller exports and
 *      checks the rate-limit math at the boundary values.
 *   2. Opt-in HTTP smoke (`RUN_INVITATION_HTTP=1`, needs Mongo). Drives the
 *      real endpoints and asserts:
 *        - cancel sets status and the founder cannot accept (409
 *          INVITATION_CANCELLED).
 *        - resend before 5-minute cooldown returns 429 +
 *          retryAfterSeconds.
 *        - rewinding lastSentAt past the cooldown lets resend succeed and
 *          mints a fresh token.
 *
 * Run from server/:
 *   node scripts/step_2_13_invitation_lifecycle_smoke.mjs
 *   RUN_INVITATION_HTTP=1 node scripts/step_2_13_invitation_lifecycle_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

if (!process.env.EMAIL_DRIVER) process.env.EMAIL_DRIVER = "log";

// ---- Part 1: controller surface + rate-limit math (no DB) ----------------

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;
function retryAfterSeconds(elapsedMs) {
  if (elapsedMs >= RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
}

{
  const ctrl = await import("../src/controllers/invitations.controller.js");
  for (const name of [
    "createInvitation",
    "cancelInvitation",
    "resendInvitation",
    "listCohortInvitations",
    "respondToInvitation",
  ]) {
    assert.equal(typeof ctrl[name], "function", `${name} is exported`);
  }

  assert.equal(retryAfterSeconds(0), 300, "elapsed=0 -> 300s");
  assert.equal(retryAfterSeconds(60 * 1000), 240, "elapsed=60s -> 240s");
  assert.equal(retryAfterSeconds(299 * 1000), 1, "elapsed=299s -> 1s");
  assert.equal(retryAfterSeconds(300 * 1000), 0, "elapsed=300s -> 0s");
  assert.equal(retryAfterSeconds(301 * 1000), 0, "elapsed>cooldown -> 0s");
}

console.log("Part 1: invitation controller + rate-limit math PASSED");

// ---- Part 2: HTTP integration smoke (opt-in) ------------------------------

if (process.env.RUN_INVITATION_HTTP !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_INVITATION_HTTP=1 and Mongo env to run).",
  );
  process.exit(0);
}

const request = (await import("supertest")).default;
const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { signAuthToken } = await import("../src/config/jwt.js");
const { default: app } = await import("../src/app.js");
const Organization = (await import("../src/models/Organization.js")).default;
const OrganizationAdmin = (await import("../src/models/OrganizationAdmin.js"))
  .default;
const Cohort = (await import("../src/models/Cohort.js")).default;
const CohortInvitation = (await import("../src/models/CohortInvitation.js"))
  .default;

await connectDatabase();

async function signup(role) {
  const email = `inv_${role}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `Inv ${role}`,
    email,
    password: "InvPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role} should 201`);
  const user = res.body?.data?.user;
  const userId = String(user?._id ?? user?.id);
  // Auth tokens are HttpOnly cookies; smokes use Bearer via signAuthToken.
  const token = signAuthToken({
    userId,
    role: user?.role || role,
    isAdmin: user?.isAdmin === true,
  });
  return { token, userId, email };
}

const orgOwner = await signup("organization-admin");
const org = await Organization.create({
  name: `Inv Org ${Date.now()}`,
  createdBy: orgOwner.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: orgOwner.userId,
});
// JWT from signup may still say "organization"; list route uses requireOrgAdmin.
orgOwner.token = signAuthToken({
  userId: orgOwner.userId,
  role: "organization-admin",
  isAdmin: false,
});
const cohort = await Cohort.create({
  name: `Inv Cohort ${Date.now()}`,
  organizationId: org._id,
  createdBy: orgOwner.userId,
});

const founder = await signup("founder");

// --- create invitation ---
let invitationId = null;
{
  const res = await request(app)
    .post("/api/v1/invitations/create")
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({
      cohortId: String(cohort._id),
      email: founder.email,
      founderId: founder.userId,
      message: "Smoke invite",
    });
  assert.equal(res.status, 201, "create invitation -> 201");
  invitationId =
    res.body?.data?._id ||
    res.body?.data?.id ||
    res.body?.data?.invitation?._id;
  assert.ok(invitationId, "invitation id present");
}

// --- listCohortInvitations returns it ---
{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohort._id}/invitations`)
    .set("Authorization", `Bearer ${orgOwner.token}`);
  assert.equal(res.status, 200, "list invitations -> 200");
  const rows = res.body?.data?.items || [];
  assert.equal(rows.length, 1, "one pending invitation");
  assert.equal(res.body?.data?.total, 1, "total count");
  assert.equal(rows[0].status, "pending", "pending status");
}

// --- resend before cooldown -> 429 ---
{
  const res = await request(app)
    .post(`/api/v1/invitations/${invitationId}/resend`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({});
  assert.equal(res.status, 429, "resend before cooldown -> 429");
  assert.equal(
    res.body?.code,
    "INVITATION_RESEND_TOO_SOON",
    "code INVITATION_RESEND_TOO_SOON",
  );
  const ra = res.body?.errors?.[0]?.retryAfterSeconds;
  assert.ok(
    typeof ra === "number" && ra > 0 && ra <= 300,
    `retryAfterSeconds is sane: ${ra}`,
  );
}

// --- rewind lastSentAt past cooldown then resend -> 200 + new token ---
const original = await CohortInvitation.findById(invitationId);
const originalToken = original.token;
await CohortInvitation.findByIdAndUpdate(invitationId, {
  lastSentAt: new Date(Date.now() - 6 * 60 * 1000),
  createdAt: new Date(Date.now() - 6 * 60 * 1000),
});
{
  const res = await request(app)
    .post(`/api/v1/invitations/${invitationId}/resend`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({});
  assert.equal(res.status, 200, "resend after cooldown -> 200");
  const row = await CohortInvitation.findById(invitationId).lean();
  assert.notEqual(row.token, originalToken, "token rotated on resend");
  assert.ok(row.lastSentAt, "lastSentAt stamped");
}

// --- cancel -> 200, founder cannot accept ---
{
  const res = await request(app)
    .post(`/api/v1/invitations/${invitationId}/cancel`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({});
  assert.equal(res.status, 200, "cancel -> 200");
  const row = await CohortInvitation.findById(invitationId).lean();
  assert.equal(row.status, "cancelled", "status flipped to cancelled");
}
{
  const res = await request(app)
    .post(`/api/v1/invitations/${invitationId}/respond`)
    .set("Authorization", `Bearer ${founder.token}`)
    .send({ status: "accepted" });
  assert.equal(res.status, 409, "respond after cancel -> 409");
  assert.equal(
    res.body?.code,
    "INVITATION_CANCELLED",
    "code INVITATION_CANCELLED",
  );
}

// --- cancel again -> 409 INVITATION_NOT_PENDING ---
{
  const res = await request(app)
    .post(`/api/v1/invitations/${invitationId}/cancel`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({});
  assert.equal(res.status, 409, "double cancel -> 409");
  assert.equal(
    res.body?.code,
    "INVITATION_NOT_PENDING",
    "code INVITATION_NOT_PENDING",
  );
}

// --- non-admin cannot cancel/resend ---
{
  const intruder = await signup("founder");
  const res = await request(app)
    .post(`/api/v1/invitations/${invitationId}/cancel`)
    .set("Authorization", `Bearer ${intruder.token}`)
    .send({});
  assert.equal(res.status, 403, "non-admin cancel -> 403");
  assert.equal(
    res.body?.code,
    "INVITATION_FORBIDDEN",
    "code INVITATION_FORBIDDEN",
  );
}

// --- unknown id -> 404 ---
{
  const bogus = new mongoose.Types.ObjectId().toString();
  const res = await request(app)
    .post(`/api/v1/invitations/${bogus}/cancel`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({});
  assert.equal(res.status, 404, "unknown id -> 404");
  assert.equal(res.body?.code, "INVITATION_NOT_FOUND");
}

await mongoose.disconnect();
console.log("Part 2: HTTP invitation lifecycle smoke PASSED");
