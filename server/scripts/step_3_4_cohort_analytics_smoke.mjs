#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 3.4 — Cohort analytics trends smoke.
 *
 * Part 1: parseAnalyticsRange + pure trend builders (no DB).
 * Part 2: HTTP integration (`RUN_COHORT_ANALYTICS_HTTP_FLOWS=1`, needs Mongo).
 *
 * Run from server/:
 *   node scripts/step_3_4_cohort_analytics_smoke.mjs
 *   RUN_COHORT_ANALYTICS_HTTP_FLOWS=1 node scripts/step_3_4_cohort_analytics_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

const { parseAnalyticsRange, DEFAULT_ANALYTICS_RANGE } = await import(
  "../src/utils/parseAnalyticsRange.js"
);
const {
  TREND_WEEK_COUNT,
  buildEngagementByWeek,
  buildMilestoneVelocityByWeek,
  buildStreakHistogram,
  buildCohortAnalyticsTrends,
} = await import("../src/utils/cohortAnalyticsTrends.js");
const { weekKeysTrailing, computeWeeklyStreak } = await import(
  "../src/utils/cohortWeekUtils.js"
);

// ---- Part 1: pure helpers -------------------------------------------------

{
  const def = parseAnalyticsRange({});
  assert.equal(def.range, DEFAULT_ANALYTICS_RANGE);
  assert.ok(def.since instanceof Date);

  const all = parseAnalyticsRange({ range: "all" });
  assert.equal(all.range, "all");
  assert.equal(all.since, null);

  const bad = parseAnalyticsRange({ range: "invalid" });
  assert.equal(bad.range, DEFAULT_ANALYTICS_RANGE);
}

const now = new Date("2026-05-16T12:00:00.000Z");
const weekKeys = weekKeysTrailing(TREND_WEEK_COUNT, now);

{
  const engagement = buildEngagementByWeek(
    [{ createdAt: new Date(weekKeys[0]) }, { createdAt: new Date(weekKeys[0]) }],
    weekKeys,
  );
  assert.equal(engagement.length, TREND_WEEK_COUNT);
  assert.equal(engagement[0].activityCount, 2);
  assert.ok(engagement[0].label.length > 0);
}

{
  const velocity = buildMilestoneVelocityByWeek(
    [{ updatedAt: new Date(weekKeys[1]) }],
    weekKeys,
  );
  assert.equal(velocity.length, TREND_WEEK_COUNT);
  assert.equal(velocity[1].completedCount, 1);
}

{
  const outcomes = weekKeys.slice(0, 2).map((key) => ({
    weekOf: new Date(key),
    status: "completed",
  }));
  assert.equal(computeWeeklyStreak(outcomes, TREND_WEEK_COUNT, now), 2);

  const byFounder = new Map([["f1", outcomes], ["f2", []]]);
  const hist = buildStreakHistogram(["f1", "f2"], byFounder, TREND_WEEK_COUNT, now);
  const total = hist.reduce((s, b) => s + b.founderCount, 0);
  assert.equal(total, 2);
  assert.equal(hist.find((b) => b.streakWeeks === 2)?.founderCount, 1);
  assert.equal(hist.find((b) => b.streakWeeks === 0)?.founderCount, 1);
}

{
  const trends = buildCohortAnalyticsTrends({ founderIds: [] });
  assert.equal(trends.engagementByWeek.length, TREND_WEEK_COUNT);
  assert.equal(trends.milestoneVelocityByWeek.length, TREND_WEEK_COUNT);
}

console.log("Part 1: cohort analytics trends smoke PASSED");

if (process.env.RUN_COHORT_ANALYTICS_HTTP_FLOWS !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_COHORT_ANALYTICS_HTTP_FLOWS=1 and Mongo env to run).",
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
const WeeklyOutcome = (await import("../src/models/WeeklyOutcome.js")).default;
const Milestone = (await import("../src/models/Milestone.js")).default;
const Activity = (await import("../src/models/Activity.js")).default;
const { startOfWeekMondayUTC } = await import("../src/utils/cohortWeekUtils.js");

await connectDatabase();

const agent = request.agent(app);

async function signupWithClient(client, role, nameSuffix = "") {
  const email = `ca34_${role}_${nameSuffix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}@example.com`;
  const res = await client.post("/api/v1/auth/signup").send({
    name: `CA ${role}`,
    email,
    password: "CAPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role}`);
  return {
    userId: String(res.body?.data?.user?._id ?? res.body?.data?.user?.id),
    email,
  };
}

const orgOwner = await signupWithClient(agent, "organization-admin", "owner");
const org = await Organization.create({
  name: `CA Org ${Date.now()}`,
  createdBy: orgOwner.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: orgOwner.userId,
});

const cohort = await Cohort.create({
  name: `CA Cohort ${Date.now()}`,
  organizationId: org._id,
  createdBy: orgOwner.userId,
});
const cohortId = String(cohort._id);

const activeFounder = await signupWithClient(request(app), "founder", "active");
const idleFounder = await signupWithClient(request(app), "founder", "idle");

const activeStartup = await Startup.create({
  name: "Active Startup",
  founderId: activeFounder.userId,
});
const idleStartup = await Startup.create({
  name: "Idle Startup",
  founderId: idleFounder.userId,
});

await CohortMembership.create({
  cohortId,
  founderId: activeFounder.userId,
  startupId: activeStartup._id,
});
await CohortMembership.create({
  cohortId,
  founderId: idleFounder.userId,
  startupId: idleStartup._id,
});

const weekStart = startOfWeekMondayUTC();
for (let i = 0; i < 2; i += 1) {
  const weekOf = new Date(weekStart);
  weekOf.setUTCDate(weekOf.getUTCDate() - 7 * i);
  await WeeklyOutcome.create({
    founderId: activeFounder.userId,
    startupId: activeStartup._id,
    weekOf,
    goal: `Week ${i}`,
    status: "completed",
  });
}

await Milestone.create({
  founderId: activeFounder.userId,
  startupId: activeStartup._id,
  title: "Shipped",
  status: "completed",
  sequence: 1,
  updatedAt: new Date(),
});

for (let i = 0; i < 3; i += 1) {
  await Activity.create({
    startupId: activeStartup._id,
    userId: activeFounder.userId,
    type: "note",
    text: `Activity ${i}`,
  });
}

const res = await agent.get(`/api/v1/cohorts/${cohortId}/analytics/overview`);
assert.equal(res.status, 200);
assert.equal(res.body?.success, true);

const analytics = res.body?.data?.analytics;
assert.ok(analytics?.trends, "has trends");
assert.equal(analytics.trends.engagementByWeek.length, TREND_WEEK_COUNT);
assert.equal(analytics.trends.milestoneVelocityByWeek.length, TREND_WEEK_COUNT);

const histSum = analytics.trends.weeklyOutcomeStreakHistogram.reduce(
  (s, b) => s + b.founderCount,
  0,
);
assert.equal(histSum, analytics.cohortSize);

const totalActivity = analytics.trends.engagementByWeek.reduce(
  (s, w) => s + w.activityCount,
  0,
);
assert.ok(totalActivity >= 3, "active startup activities counted");

const activeStreak = analytics.trends.weeklyOutcomeStreakHistogram.find(
  (b) => b.streakWeeks >= 2,
);
assert.ok(activeStreak && activeStreak.founderCount >= 1, "active founder streak bucket");

const res30 = await agent.get(
  `/api/v1/cohorts/${cohortId}/analytics/overview?range=30d`,
);
assert.equal(res30.status, 200);
assert.equal(res30.body?.data?.analytics?.range, "30d");

console.log("Part 2: cohort analytics HTTP smoke PASSED");

await mongoose.disconnect();
process.exit(0);
