#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 3.1 — Paginated list query smoke.
 *
 * Part 1: parseListQuery / escapeRegex (no DB).
 * Part 2: HTTP integration (`RUN_LIST_QUERY_HTTP_FLOWS=1`, needs Mongo).
 *
 * Run from server/:
 *   node scripts/step_3_1_list_query_smoke.mjs
 *   RUN_LIST_QUERY_HTTP_FLOWS=1 node scripts/step_3_1_list_query_smoke.mjs
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import process from "node:process";

const {
  parseListQuery,
  escapeRegex,
  buildSearchFilter,
} = await import("../src/utils/listQuery.js");

// ---- Part 1: parser smoke -------------------------------------------------

{
  const req = { query: { limit: "200", skip: "-1", sortBy: "hacked", sortOrder: "asc" } };
  const opts = parseListQuery(req, {
    defaultSortBy: "createdAt",
    allowedSortFields: ["createdAt", "title"],
    defaultSortOrder: "desc",
  });
  assert.equal(opts.limit, 100, "limit clamped to max 100");
  assert.equal(opts.skip, 0, "skip floored at 0");
  assert.equal(opts.sortBy, "createdAt", "invalid sortBy falls back");
  assert.equal(opts.sort.createdAt, 1, "asc sort order");
}

{
  const req = { query: { q: "  hello  ", status: "active" } };
  const opts = parseListQuery(req, { allowedSortFields: ["createdAt"] });
  assert.equal(opts.q, "hello");
  assert.equal(opts.status, "active");
}

{
  assert.equal(escapeRegex("a.b*c"), "a\\.b\\*c");
}

{
  const f = buildSearchFilter("test", ["title"]);
  assert.ok(f.$or);
  assert.equal(f.$or.length, 1);
}

console.log("Part 1: listQuery parser smoke PASSED");

if (process.env.RUN_LIST_QUERY_HTTP_FLOWS !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_LIST_QUERY_HTTP_FLOWS=1 and Mongo env to run).",
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
const User = (await import("../src/models/User.js")).default;
const Startup = (await import("../src/models/Startup.js")).default;
const Resource = (await import("../src/models/Resource.js")).default;
const Event = (await import("../src/models/Event.js")).default;
const Announcement = (await import("../src/models/Announcement.js")).default;
const ProgramMilestone = (await import("../src/models/ProgramMilestone.js"))
  .default;
const Deliverable = (await import("../src/models/Deliverable.js")).default;
const DeliverableSubmission = (
  await import("../src/models/DeliverableSubmission.js")
).default;
const MentorProfile = (await import("../src/models/MentorProfile.js")).default;
const Message = (await import("../src/models/Message.js")).default;
const CohortInvitation = (await import("../src/models/CohortInvitation.js"))
  .default;

await connectDatabase();

function assertListEnvelope(body, label) {
  assert.equal(body?.success, true, `${label} success`);
  const data = body?.data;
  assert.ok(Array.isArray(data?.items), `${label} has items array`);
  assert.equal(typeof data?.total, "number", `${label} has total`);
  assert.equal(typeof data?.limit, "number", `${label} has limit`);
  assert.equal(typeof data?.skip, "number", `${label} has skip`);
  return data;
}

const agent = request.agent(app);

async function signupWithClient(client, role, nameSuffix = "") {
  const email = `list31_${role}_${nameSuffix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}@example.com`;
  const res = await client.post("/api/v1/auth/signup").send({
    name: `List ${role}`,
    email,
    password: "ListPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role}`);
  return {
    userId: String(res.body?.data?.user?._id ?? res.body?.data?.user?.id),
    email,
  };
}

const signup = (role, suffix) => signupWithClient(agent, role, suffix);

const orgOwner = await signup("organization-admin", "owner");
const org = await Organization.create({
  name: `List Query Org ${Date.now()}`,
  createdBy: orgOwner.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: orgOwner.userId,
});

const cohort = await Cohort.create({
  name: "List Cohort",
  organizationId: org._id,
  createdBy: orgOwner.userId,
});
const cohortId = String(cohort._id);
const orgId = String(org._id);

const founderA = await signupWithClient(request(app), "founder", "a");
const founderB = await signupWithClient(request(app), "founder", "b");
const startupA = await Startup.create({
  name: "Alpha Startup",
  founderId: founderA.userId,
});
const startupB = await Startup.create({
  name: "Beta Startup",
  founderId: founderB.userId,
});

await CohortMembership.create({
  cohortId,
  founderId: founderA.userId,
  startupId: startupA._id,
  status: "active",
});
await CohortMembership.create({
  cohortId,
  founderId: founderB.userId,
  startupId: startupB._id,
  status: "active",
});

await Resource.insertMany([
  { cohortId, title: "Alpha Guide", description: "first", category: "guide", type: "document" },
  { cohortId, title: "Beta Template", description: "second", category: "template", type: "template" },
  {
    cohortId,
    title: "Gamma Tool",
    description: "third",
    category: "tool",
    type: "tool",
    tags: ["list31_tag_unique"],
  },
]);

const deliverable = await Deliverable.create({
  cohortId,
  organizationId: orgId,
  title: "Pitch Deck",
  description: "deck",
  createdBy: orgOwner.userId,
});
await DeliverableSubmission.create({
  deliverableId: deliverable._id,
  founderId: founderA.userId,
  startupId: startupA._id,
  content: "submission alpha content",
  status: "submitted",
});

await Event.create({
  cohortId,
  organizationId: orgId,
  title: "Demo Day",
  description: "big event",
  startsAt: new Date(Date.now() + 86_400_000),
  eventType: "demo-day",
});

await Announcement.create({
  cohortId,
  organizationId: orgId,
  title: "Urgent Update",
  body: "please read",
  priority: "urgent",
  createdBy: orgOwner.userId,
});

await ProgramMilestone.create({
  cohortId,
  title: "Week 1 Checkpoint",
  category: "checkpoint",
  dueDate: new Date(Date.now() + 7 * 86_400_000),
});

const mentorUser = await signupWithClient(request(app), "mentor", "m1");
await MentorProfile.create({
  userId: mentorUser.userId,
  organizationId: orgId,
  expertise: ["growth"],
  status: "active",
});

await Message.create({
  organizationId: orgId,
  cohortId,
  fromUserId: founderA.userId,
  toUserId: orgOwner.userId,
  subject: "Hello org",
  body: "founder message body",
  messageType: "individual",
});

const inviteEmailAlpha = `list31_invite_alpha_${Date.now()}@example.com`;
const inviteEmailBeta = `list31_invite_beta_${Date.now()}@example.com`;
await CohortInvitation.insertMany([
  {
    cohortId,
    organizationId: orgId,
    founderId: founderA.userId,
    email: inviteEmailAlpha,
    status: "pending",
    token: crypto.randomUUID(),
    message: "alpha cohort invite",
  },
  {
    cohortId,
    organizationId: orgId,
    founderId: founderB.userId,
    email: inviteEmailBeta,
    status: "pending",
    token: crypto.randomUUID(),
    message: "beta cohort invite",
  },
]);

function authedGet(path) {
  return agent.get(path);
}

// Members
{
  const page1 = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/members?limit=1&skip=0`)).body,
    "members page1",
  );
  const page2 = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/members?limit=1&skip=1`)).body,
    "members page2",
  );
  assert.equal(page1.total, 2, "members total");
  assert.notEqual(page1.items[0]?.founderId, page2.items[0]?.founderId, "pages disjoint");

  const search = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/members?q=Alpha`)).body,
    "members search",
  );
  assert.equal(search.total, 1, "members q=Alpha narrows to one");
}

// Mentors
{
  const data = assertListEnvelope(
    (await authedGet(`/api/v1/organizations/${orgId}/mentors`)).body,
    "mentors",
  );
  assert.ok(data.total >= 1, "mentors total");
}

// Resources
{
  const p0 = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/resources?limit=2&skip=0`))
      .body,
    "resources p0",
  );
  const p1 = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/resources?limit=2&skip=2`))
      .body,
    "resources p1",
  );
  assert.equal(p0.total, 3);
  assert.equal(p0.items.length, 2);
  assert.equal(p1.items.length, 1);

  const qAlpha = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/resources?q=Alpha`)).body,
    "resources q",
  );
  assert.equal(qAlpha.total, 1);

  const qTag = assertListEnvelope(
    (
      await authedGet(
        `/api/v1/cohorts/${cohortId}/resources?q=list31_tag_unique`,
      )
    ).body,
    "resources q tag",
  );
  assert.equal(qTag.total, 1, "resources q=tag matches indexed tags");
  assert.ok(
    qTag.items.some((r) =>
      (r.tags || []).some((t) => String(t).includes("list31_tag_unique")),
    ),
    "tag search returns resource with list31_tag_unique",
  );
}

// Deliverables, submissions, events, announcements, milestones, messages
{
  assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/deliverables`)).body,
    "deliverables",
  );
  assertListEnvelope(
    (
      await authedGet(`/api/v1/deliverables/${deliverable._id}/submissions`)
    ).body,
    "submissions",
  );
  assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/events`)).body,
    "events",
  );
  assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/announcements`)).body,
    "announcements",
  );
  assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/program-milestones`)).body,
    "milestones",
  );
  assertListEnvelope(
    (await authedGet(`/api/v1/messages/organization/${orgId}`)).body,
    "messages",
  );
}

// Cohort invitations (Step 1.1 paginated)
{
  const invAll = assertListEnvelope(
    (await authedGet(`/api/v1/cohorts/${cohortId}/invitations?status=pending`))
      .body,
    "invitations",
  );
  assert.ok(invAll.total >= 2, "invitations total");

  const invP0 = assertListEnvelope(
    (await authedGet(
      `/api/v1/cohorts/${cohortId}/invitations?status=pending&limit=1&skip=0`,
    )).body,
    "invitations page0",
  );
  const invP1 = assertListEnvelope(
    (await authedGet(
      `/api/v1/cohorts/${cohortId}/invitations?status=pending&limit=1&skip=1`,
    )).body,
    "invitations page1",
  );
  assert.notEqual(invP0.items[0]?.id, invP1.items[0]?.id, "invitation pages disjoint");

  const invSearch = assertListEnvelope(
    (await authedGet(
      `/api/v1/cohorts/${cohortId}/invitations?status=pending&q=list31_invite_alpha`,
    )).body,
    "invitations search",
  );
  assert.equal(invSearch.total, 1, "invitations q narrows to one");
  assert.ok(
    String(invSearch.items[0]?.email || "").includes("list31_invite_alpha"),
    "search matches alpha email",
  );
}

// Invalid sortBy must not 500
{
  const res = await authedGet(
    `/api/v1/cohorts/${cohortId}/resources?sortBy=__proto__`,
  );
  assert.equal(res.status, 200);
  assertListEnvelope(res.body, "resources bad sort");
}

await mongoose.disconnect();
console.log("Part 2: HTTP list-query smoke PASSED");
