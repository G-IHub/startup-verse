#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.1 / 3.5 — Cohort badge counts smoke.
 *
 * Part 1: exports (no DB).
 * Part 2: HTTP (`RUN_BADGE_COUNTS_HTTP=1`, needs Mongo).
 *
 * From server/:
 *   npm run test:step-3-5-badge-counts
 *   RUN_BADGE_COUNTS_HTTP=1 npm run test:step-3-5-badge-counts
 */
import assert from "node:assert/strict";
import process from "node:process";

// ---- Part 1 -----------------------------------------------------------------

{
  const helper = await import("../src/utils/cohortBadgeCounts.js");
  assert.equal(
    typeof helper.computeCohortBadgeCounts,
    "function",
    "computeCohortBadgeCounts exported",
  );

  const ctrl = await import("../src/controllers/cohortWorkspace.controller.js");
  assert.equal(
    typeof ctrl.getCohortBadgeCounts,
    "function",
    "getCohortBadgeCounts exported",
  );
}

console.log("Part 1: badge counts surface PASSED");

if (process.env.RUN_BADGE_COUNTS_HTTP !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_BADGE_COUNTS_HTTP=1 and Mongo env to run).",
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
const CohortMembership = (await import("../src/models/CohortMembership.js"))
  .default;
const Startup = (await import("../src/models/Startup.js")).default;
const Message = (await import("../src/models/Message.js")).default;
const Deliverable = (await import("../src/models/Deliverable.js")).default;
const DeliverableSubmission = (
  await import("../src/models/DeliverableSubmission.js")
).default;
const Announcement = (await import("../src/models/Announcement.js")).default;
const Event = (await import("../src/models/Event.js")).default;
const { computeCohortBadgeCounts } = await import(
  "../src/utils/cohortBadgeCounts.js"
);

await connectDatabase();

async function signup(role) {
  const email = `badge35_${role}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}@example.com`;
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `Badge ${role}`,
    email,
    password: "BadgePass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role}`);
  const user = res.body?.data?.user;
  const userId = String(user?._id ?? user?.id);
  const token = signAuthToken({
    userId,
    role: user?.role || role,
    isAdmin: user?.isAdmin === true,
  });
  return { token, userId, email };
}

const admin = await signup("organization-admin");
const org = await Organization.create({
  name: `Badge Org ${Date.now()}`,
  createdBy: admin.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: admin.userId,
});
admin.token = signAuthToken({
  userId: admin.userId,
  role: "organization-admin",
  isAdmin: false,
});

const cohort = await Cohort.create({
  name: `Badge Cohort ${Date.now()}`,
  organizationId: org._id,
  createdBy: admin.userId,
});
const cohortId = String(cohort._id);
const orgId = String(org._id);

const founder = await signup("founder");
const startup = await Startup.create({
  name: "Badge Startup",
  founderId: founder.userId,
});
await CohortMembership.create({
  cohortId: cohort._id,
  founderId: founder.userId,
  startupId: startup._id,
  status: "active",
});

await Message.create({
  organizationId: org._id,
  cohortId: cohort._id,
  fromUserId: founder.userId,
  toUserId: admin.userId,
  subject: "Badge smoke message",
  body: "unread for admin",
  messageType: "individual",
  readAt: null,
});

const deliverable = await Deliverable.create({
  cohortId: cohort._id,
  organizationId: org._id,
  title: "Badge Deliverable",
  description: "smoke",
  createdBy: admin.userId,
});
const submission = await DeliverableSubmission.create({
  deliverableId: deliverable._id,
  founderId: founder.userId,
  startupId: startup._id,
  content: "pending review",
  status: "submitted",
});

const announcement = await Announcement.create({
  cohortId: cohort._id,
  organizationId: org._id,
  title: "Badge Announcement",
  body: "unread by admin",
  createdBy: admin.userId,
  readBy: [],
});

const eventStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
await Event.create({
  cohortId: cohort._id,
  organizationId: org._id,
  title: "Badge Event Soon",
  description: "within 7d",
  startsAt: eventStart,
  eventType: "workshop",
});

const helperCounts = await computeCohortBadgeCounts(cohortId, admin.userId);
assert.ok(helperCounts.unreadMessages >= 1, "helper unreadMessages");
assert.ok(helperCounts.pendingSubmissions >= 1, "helper pendingSubmissions");
assert.ok(helperCounts.newAnnouncements >= 1, "helper newAnnouncements");
assert.ok(helperCounts.upcomingEventsNext7d >= 1, "helper upcomingEventsNext7d");

function assertBadgePayload(body) {
  assert.equal(body?.success, true, "badge counts success");
  const data = body?.data;
  assert.equal(typeof data?.unreadMessages, "number");
  assert.equal(typeof data?.pendingSubmissions, "number");
  assert.equal(typeof data?.newAnnouncements, "number");
  assert.equal(typeof data?.upcomingEventsNext7d, "number");
  return data;
}

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/badge-counts`)
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(res.status, 200, "admin badge counts -> 200");
  const data = assertBadgePayload(res.body);
  assert.ok(data.unreadMessages >= 1, "unreadMessages");
  assert.ok(data.pendingSubmissions >= 1, "pendingSubmissions");
  assert.ok(data.newAnnouncements >= 1, "newAnnouncements");
  assert.ok(data.upcomingEventsNext7d >= 1, "upcomingEventsNext7d");
}

{
  const res = await request(app).get(
    `/api/v1/cohorts/${cohortId}/badge-counts`,
  );
  assert.equal(res.status, 401, "unauthenticated -> 401");
}

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/badge-counts`)
    .set("Authorization", `Bearer ${founder.token}`);
  assert.equal(res.status, 403, "founder -> 403");
}

await Message.updateOne(
  { _id: (await Message.findOne({ toUserId: admin.userId, readAt: null }))._id },
  { $set: { readAt: new Date() } },
);

await request(app)
  .post(`/api/v1/cohorts/${cohortId}/announcements/${announcement._id}/read`)
  .set("Authorization", `Bearer ${admin.token}`);

await request(app)
  .post(`/api/v1/deliverables/submissions/${submission._id}/review`)
  .set("Authorization", `Bearer ${admin.token}`)
  .send({ status: "reviewed", feedback: "ok" });

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/badge-counts`)
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(res.status, 200);
  const data = assertBadgePayload(res.body);
  assert.equal(data.unreadMessages, 0, "unreadMessages cleared");
  assert.equal(data.pendingSubmissions, 0, "pendingSubmissions cleared");
  assert.equal(data.newAnnouncements, 0, "newAnnouncements cleared");
  assert.ok(data.upcomingEventsNext7d >= 1, "events unchanged");
}

await mongoose.disconnect();
console.log("Part 2: badge counts HTTP smoke PASSED");
