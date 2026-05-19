#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 3.3 — Portfolio health scoring smoke.
 *
 * Part 1: pure scoring (no DB).
 * Part 2: HTTP integration (`RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1`, needs Mongo).
 *
 * Run from server/:
 *   node scripts/step_3_3_portfolio_health_smoke.mjs
 *   RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1 node scripts/step_3_3_portfolio_health_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

const {
  PORTFOLIO_FACTOR_MAX,
  TEAM_ACTIVITY_FULL_SCALE,
  scoreWeeklyExecution,
  scoreTaskCompletion,
  scoreTeamActivity,
  scoreMilestoneProgress,
  computeHealthScore,
  deriveHealthStatus,
  buildPortfolioRow,
} = await import("../src/utils/portfolioHealthScoring.js");

const { startOfWeekMondayUTC, weekKeysTrailing } = await import(
  "../src/utils/cohortWeekUtils.js"
);

// ---- Part 1: pure scoring -------------------------------------------------

const now = new Date("2026-05-16T12:00:00.000Z");
const weekKeys = weekKeysTrailing(4, now);

{
  assert.equal(scoreWeeklyExecution([], now), 0);
  assert.equal(scoreTaskCompletion({ completed: 0, total: 0 }), 0);
  assert.equal(scoreTeamActivity(0), 0);
  assert.equal(scoreMilestoneProgress({ completed: 0, total: 0 }), 0);
}

{
  const outcomes = weekKeys.map((key) => ({
    weekOf: new Date(key),
    status: "completed",
  }));
  assert.equal(scoreWeeklyExecution(outcomes, now), PORTFOLIO_FACTOR_MAX.weeklyExecution);
}

{
  assert.equal(scoreTaskCompletion({ completed: 5, total: 10 }), 13);
  assert.equal(scoreTaskCompletion({ completed: 10, total: 10 }), 25);
}

{
  assert.equal(scoreTeamActivity(TEAM_ACTIVITY_FULL_SCALE), 25);
  assert.equal(scoreTeamActivity(TEAM_ACTIVITY_FULL_SCALE + 5), 25);
  assert.equal(scoreTeamActivity(5), 13);
}

{
  assert.equal(scoreMilestoneProgress({ completed: 1, total: 2 }), 15);
  assert.equal(scoreMilestoneProgress({ completed: 2, total: 2 }), 30);
}

{
  const factors = {
    weeklyExecution: 20,
    taskCompletion: 25,
    teamActivity: 25,
    milestoneProgress: 30,
  };
  assert.equal(computeHealthScore(factors), 100);
  assert.equal(deriveHealthStatus(100), "healthy");
  assert.equal(deriveHealthStatus(69), "warning");
  assert.equal(deriveHealthStatus(39), "critical");
}

{
  const row = buildPortfolioRow({
    founderId: "abc",
    startupName: "Test Co",
    founderName: "Ada",
    aggregates: {
      weeklyOutcomes: weekKeys.map((key) => ({
        weekOf: new Date(key),
        status: "partial",
      })),
      tasks: { completed: 4, total: 4 },
      activityCount: 10,
      milestones: { completed: 3, total: 3 },
    },
    now,
  });
  assert.equal(row.health.score, 100);
  assert.equal(
    row.health.factors.weeklyExecution +
      row.health.factors.taskCompletion +
      row.health.factors.teamActivity +
      row.health.factors.milestoneProgress,
    row.health.score,
  );
}

console.log("Part 1: portfolio health scoring smoke PASSED");

if (process.env.RUN_PORTFOLIO_HEALTH_HTTP_FLOWS !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1 and Mongo env to run).",
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
const WeeklyOutcome = (await import("../src/models/WeeklyOutcome.js")).default;
const Task = (await import("../src/models/Task.js")).default;
const Activity = (await import("../src/models/Activity.js")).default;
const Milestone = (await import("../src/models/Milestone.js")).default;

await connectDatabase();

const agent = request.agent(app);

async function signupWithClient(client, role, nameSuffix = "") {
  const email = `ph33_${role}_${nameSuffix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}@example.com`;
  const res = await client.post("/api/v1/auth/signup").send({
    name: `PH ${role}`,
    email,
    password: "PHPass123!",
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
  name: `PH Org ${Date.now()}`,
  createdBy: orgOwner.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: orgOwner.userId,
});

const cohort = await Cohort.create({
  name: `PH Cohort ${Date.now()}`,
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
for (let i = 0; i < 4; i += 1) {
  const weekOf = new Date(weekStart);
  weekOf.setUTCDate(weekOf.getUTCDate() - 7 * i);
  await WeeklyOutcome.create({
    founderId: activeFounder.userId,
    startupId: activeStartup._id,
    weekOf,
    goal: `Week ${i} goal`,
    status: "completed",
  });
}

const recent = new Date();
await Task.create({
  founderId: activeFounder.userId,
  startupId: activeStartup._id,
  title: "Done task",
  status: "completed",
  updatedAt: recent,
});
await Task.create({
  founderId: activeFounder.userId,
  startupId: activeStartup._id,
  title: "Open task",
  status: "pending",
  updatedAt: recent,
});

for (let i = 0; i < TEAM_ACTIVITY_FULL_SCALE; i += 1) {
  await Activity.create({
    startupId: activeStartup._id,
    userId: activeFounder.userId,
    type: "note",
    text: `Activity ${i}`,
  });
}

await Milestone.create({
  founderId: activeFounder.userId,
  startupId: activeStartup._id,
  title: "M1",
  status: "completed",
  sequence: 1,
});
await Milestone.create({
  founderId: activeFounder.userId,
  startupId: activeStartup._id,
  title: "M2",
  status: "completed",
  sequence: 2,
});

const res = await agent.get(`/api/v1/cohorts/${cohortId}/portfolio-health`);
assert.equal(res.status, 200, "portfolio-health 200");
assert.equal(res.body?.success, true);

const portfolio = res.body?.data?.portfolio ?? [];
assert.equal(portfolio.length, 2, "two portfolio rows");

const byFounder = new Map(portfolio.map((p) => [p.founderId, p]));
const activeRow = byFounder.get(activeFounder.userId);
const idleRow = byFounder.get(idleFounder.userId);
assert.ok(activeRow, "active founder row");
assert.ok(idleRow, "idle founder row");

const legacyFactors = { weeklyExecution: 15, taskCompletion: 12, teamActivity: 15, milestoneProgress: 10 };
for (const row of portfolio) {
  const f = row.health.factors;
  const isLegacy =
    f.weeklyExecution === legacyFactors.weeklyExecution &&
    f.taskCompletion === legacyFactors.taskCompletion &&
    f.teamActivity === legacyFactors.teamActivity &&
    f.milestoneProgress === legacyFactors.milestoneProgress;
  assert.ok(!isLegacy, "factors must not be legacy placeholders");
  const sum =
    f.weeklyExecution + f.taskCompletion + f.teamActivity + f.milestoneProgress;
  assert.equal(sum, row.health.score, "factor sum equals score");
}

assert.ok(
  activeRow.health.score > idleRow.health.score,
  "active founder scores higher than idle",
);

console.log("Part 2: portfolio health HTTP smoke PASSED");

await mongoose.disconnect();
process.exit(0);
