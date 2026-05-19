#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.9 — Per-startup snapshot smoke.
 *
 * Two parts:
 *   1. In-process unit smoke for the pure `computeContributionBalance`
 *      helper. Runs always (no DB needed).
 *   2. HTTP integration smoke against a real MongoDB. Asserts the
 *      negative paths (401 / 403 / 404) and the happy path shape.
 *      Gated behind `RUN_SNAPSHOT_HTTP_FLOWS=1`.
 *
 * Run from server/ (with `.env` loaded for HTTP mode):
 *   node scripts/step_2_9_snapshot_smoke.mjs
 *   RUN_SNAPSHOT_HTTP_FLOWS=1 node scripts/step_2_9_snapshot_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

const {
  computeContributionBalance,
  CONTRIBUTION_BALANCED_MAX_SHARE,
} = await import("../src/utils/startupSnapshot.js");

// ---- Part 1: pure helper smoke -------------------------------------------

{
  const empty = computeContributionBalance([]);
  assert.equal(empty.topContributor, null, "empty list has no top contributor");
  assert.equal(empty.isBalanced, true, "empty list is trivially balanced");
}

{
  const zero = computeContributionBalance([
    { id: "a", name: "A", completed: 0 },
    { id: "b", name: "B", completed: 0 },
  ]);
  assert.equal(zero.topContributor, null, "all-zero list has no top contributor");
  assert.equal(zero.isBalanced, true, "all-zero list is balanced");
}

{
  const balanced = computeContributionBalance([
    { id: "a", name: "A", completed: 5 },
    { id: "b", name: "B", completed: 5 },
  ]);
  assert.equal(balanced.topContributor.percentage, 50, "50/50 → 50% top share");
  assert.equal(balanced.isBalanced, true, "50/50 is balanced");
}

{
  const lopsided = computeContributionBalance([
    { id: "a", name: "A", completed: 9 },
    { id: "b", name: "B", completed: 1 },
  ]);
  assert.equal(lopsided.topContributor.id, "a", "top contributor picked correctly");
  assert.equal(lopsided.topContributor.percentage, 90, "90% top share rounded");
  assert.equal(
    lopsided.isBalanced,
    false,
    `90% share > ${CONTRIBUTION_BALANCED_MAX_SHARE * 100}% threshold flips to unbalanced`,
  );
}

{
  const solo = computeContributionBalance([
    { id: "a", name: "A", completed: 7 },
  ]);
  assert.equal(solo.topContributor.percentage, 100, "solo contributor is 100%");
  assert.equal(solo.isBalanced, false, "solo contributor is flagged unbalanced");
}

console.log("Part 1: computeContributionBalance smoke PASSED");

// ---- Part 2: HTTP integration smoke (opt-in) ------------------------------

if (process.env.RUN_SNAPSHOT_HTTP_FLOWS !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_SNAPSHOT_HTTP_FLOWS=1 and Mongo env to run).",
  );
  process.exit(0);
}

const request = (await import("supertest")).default;
const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const Startup = (await import("../src/models/Startup.js")).default;
const Organization = (await import("../src/models/Organization.js")).default;
const OrganizationAdmin = (await import("../src/models/OrganizationAdmin.js"))
  .default;
const Cohort = (await import("../src/models/Cohort.js")).default;
const CohortMembership = (await import("../src/models/CohortMembership.js"))
  .default;

await connectDatabase();

async function signup(role) {
  const email = `snap_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
  const password = "SnapshotPass123!";
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `Snap ${role}`,
    email,
    password,
    role,
  });
  assert.equal(res.status, 201, `signup ${role} should 201`);
  const token = res.body?.data?.token;
  const user = res.body?.data?.user;
  return { token, userId: String(user?._id ?? user?.id), email };
}

const founder = await signup("founder");
const outsider = await signup("founder");
const orgOwner = await signup("organization");

const startup = await Startup.create({
  founderId: founder.userId,
  name: `Snap Startup ${Date.now()}`,
});

// 401 — no auth header.
{
  const res = await request(app).get(`/api/v1/startups/${startup._id}/snapshot`);
  assert.equal(res.status, 401, "no-auth returns 401");
}

// 404 — id resolves to nothing.
{
  const bogus = new mongoose.Types.ObjectId().toString();
  const res = await request(app)
    .get(`/api/v1/startups/${bogus}/snapshot`)
    .set("Authorization", `Bearer ${founder.token}`);
  assert.equal(res.status, 404, "unknown startup id returns 404");
}

// 403 — authed but unrelated user.
{
  const res = await request(app)
    .get(`/api/v1/startups/${startup._id}/snapshot`)
    .set("Authorization", `Bearer ${outsider.token}`);
  assert.equal(res.status, 403, "unrelated user returns 403");
}

// 200 — founder themselves.
{
  const res = await request(app)
    .get(`/api/v1/startups/${startup._id}/snapshot`)
    .set("Authorization", `Bearer ${founder.token}`);
  assert.equal(res.status, 200, "founder gets 200");
  assert.equal(res.body?.success, true, "envelope success=true");
  const data = res.body?.data;
  assert.ok(data, "data payload present");
  assert.equal(String(data.founderId), String(founder.userId), "founderId echoed");
  assert.equal(String(data.startupId), String(startup._id), "startupId echoed");
  assert.ok(data.executionSummary, "executionSummary present");
  assert.ok(data.activitySummary, "activitySummary present");
  assert.ok(data.contributionBalance, "contributionBalance present");
  assert.ok(Array.isArray(data.teamMembers), "teamMembers is an array");
  assert.ok(typeof data.teamSize === "number", "teamSize is numeric");
}

// 200 — org admin of a cohort the founder belongs to.
{
  const organization = await Organization.create({
    name: `Snap Org ${Date.now()}`,
    createdBy: orgOwner.userId,
  });
  await OrganizationAdmin.create({
    organizationId: organization._id,
    userId: orgOwner.userId,
  });
  const cohort = await Cohort.create({
    organizationId: organization._id,
    name: `Snap Cohort ${Date.now()}`,
  });
  await CohortMembership.create({
    cohortId: cohort._id,
    startupId: startup._id,
    founderId: founder.userId,
    status: "active",
  });

  const res = await request(app)
    .get(`/api/v1/startups/${startup._id}/snapshot`)
    .set("Authorization", `Bearer ${orgOwner.token}`);
  assert.equal(res.status, 200, "org admin gets 200 once a cohort link exists");

  // The same call by founderId should resolve to the same startup.
  const byFounder = await request(app)
    .get(`/api/v1/startups/${founder.userId}/snapshot`)
    .set("Authorization", `Bearer ${orgOwner.token}`);
  assert.equal(byFounder.status, 200, "lookup by founderId also returns 200");
  assert.equal(
    String(byFounder.body?.data?.startupId),
    String(startup._id),
    "founderId lookup resolves to the same startup",
  );
}

await mongoose.disconnect();
console.log("Part 2: HTTP snapshot smoke PASSED");
