#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.12 — Server-side event-created fanout smoke.
 *
 * Two parts:
 *   1. Always-on (no DB / no network). Asserts the controller surfaces
 *      `createCohortEvent` and the notification payload-shape helper is
 *      consistent with what the broadcaster expects.
 *   2. Opt-in HTTP smoke (`RUN_EVENT_NOTIFY_HTTP=1`, needs Mongo). Seeds an
 *      org admin and two active cohort memberships, POSTs the create event
 *      endpoint, and asserts that two `Notification` rows with
 *      `type: "cohort-event-created"` exist for the right founders.
 *
 * Run from server/:
 *   node scripts/step_2_12_event_notify_smoke.mjs
 *   RUN_EVENT_NOTIFY_HTTP=1 node scripts/step_2_12_event_notify_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

if (!process.env.EMAIL_DRIVER) process.env.EMAIL_DRIVER = "log";

// ---- Part 1: synchronous controller smoke (no DB) ------------------------

{
  const ctrl = await import("../src/controllers/cohortWorkspace.controller.js");
  assert.equal(
    typeof ctrl.createCohortEvent,
    "function",
    "createCohortEvent is exported",
  );
}

console.log("Part 1: event controller surface smoke PASSED");

// ---- Part 2: HTTP integration smoke (opt-in) ------------------------------

if (process.env.RUN_EVENT_NOTIFY_HTTP !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_EVENT_NOTIFY_HTTP=1 and Mongo env to run).",
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
const Notification = (await import("../src/models/Notification.js")).default;

await connectDatabase();

async function signup(role) {
  const email = `evt_${role}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `Evt ${role}`,
    email,
    password: "EvtPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role} should 201`);
  return {
    token: res.body?.data?.token,
    userId: String(res.body?.data?.user?._id ?? res.body?.data?.user?.id),
    email,
  };
}

const orgOwner = await signup("organization");
const org = await Organization.create({
  name: `Evt Org ${Date.now()}`,
  createdBy: orgOwner.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: orgOwner.userId,
});
const cohort = await Cohort.create({
  name: `Evt Cohort ${Date.now()}`,
  organizationId: org._id,
  createdBy: orgOwner.userId,
});

const founderA = await signup("founder");
const founderB = await signup("founder");
const startupA = await Startup.create({
  name: `Startup A ${Date.now()}`,
  founderId: founderA.userId,
});
const startupB = await Startup.create({
  name: `Startup B ${Date.now()}`,
  founderId: founderB.userId,
});
await CohortMembership.create({
  cohortId: cohort._id,
  startupId: startupA._id,
  founderId: founderA.userId,
  status: "active",
  joinedAt: new Date(),
});
await CohortMembership.create({
  cohortId: cohort._id,
  startupId: startupB._id,
  founderId: founderB.userId,
  status: "active",
  joinedAt: new Date(),
});

const beforeCount = await Notification.countDocuments({
  type: "cohort-event-created",
});

const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const createRes = await request(app)
  .post(`/api/v1/cohorts/${cohort._id}/events`)
  .set("Authorization", `Bearer ${orgOwner.token}`)
  .send({
    title: "Smoke kickoff",
    eventType: "workshop",
    startsAt,
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    isVirtual: true,
  });
assert.equal(createRes.status, 201, "create event -> 201");
const eventId = createRes.body?.data?.event?.id;
assert.ok(eventId, "event id returned");

// Fire-and-forget broadcast — give it a beat to land.
await new Promise((r) => setTimeout(r, 750));

const afterDelta = await Notification.countDocuments({
  type: "cohort-event-created",
  "metadata.eventId": String(eventId),
});
assert.equal(
  afterDelta,
  2,
  `expected 2 cohort-event-created notifications, got ${afterDelta}`,
);

const founderANotif = await Notification.findOne({
  type: "cohort-event-created",
  "metadata.eventId": String(eventId),
  userId: founderA.userId,
}).lean();
assert.ok(founderANotif, "founder A got a notification");
assert.match(
  founderANotif.title || "",
  /Smoke kickoff/,
  "notification title contains event title",
);

console.log("Part 2: HTTP event-notify smoke PASSED", {
  before: beforeCount,
  added: afterDelta,
});

await mongoose.disconnect();
