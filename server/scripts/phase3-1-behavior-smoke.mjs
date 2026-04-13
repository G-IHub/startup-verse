import assert from "node:assert/strict";
import {
  computeExecutionScoreMetrics,
  computeMilestoneCounters,
  ensureOutcomeMutable,
  validateBlockedTaskPayload,
} from "../src/domain/weeklyLoopRules.js";

function testWeeklyOutcomeMutability() {
  const finalOutcome = { status: "completed" };
  const activeOutcome = { status: "active" };
  assert.equal(ensureOutcomeMutable(null).ok, true);
  assert.equal(ensureOutcomeMutable(activeOutcome).ok, true);
  const locked = ensureOutcomeMutable(finalOutcome);
  assert.equal(locked.ok, false);
  assert.equal(locked.code, 422);
}

function testBlockedTaskValidation() {
  assert.equal(validateBlockedTaskPayload({ status: "pending" }).ok, true);
  const invalid = validateBlockedTaskPayload({
    status: "blocked",
    blockerReason: "Waiting on API",
    blockerNote: "",
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.code, 422);

  const legacyValid = validateBlockedTaskPayload({
    status: "blocked",
    blockedReason: "Dependency",
    blockedNote: "Team B not done",
  });
  assert.equal(legacyValid.ok, true);
  assert.equal(legacyValid.blockerReason, "Dependency");
  assert.equal(legacyValid.blockerNote, "Team B not done");
}

function testMilestoneCounters() {
  const counters = computeMilestoneCounters([
    { status: "pending" },
    { status: "completed" },
    { status: "completed" },
  ]);
  assert.equal(counters.totalTasks, 3);
  assert.equal(counters.tasksCompleted, 2);
}

function testExecutionScoreDerivation() {
  const metrics = computeExecutionScoreMetrics(
    [{ status: "completed" }, { status: "pending" }],
    [{ status: "completed" }, { status: "partial" }, { status: "missed" }],
  );
  assert.equal(metrics.totalTasks, 2);
  assert.equal(metrics.completedTasks, 1);
  assert.equal(metrics.totalOutcomes, 3);
  assert.equal(metrics.completedOutcomes, 1);
  assert.equal(metrics.partialOutcomes, 1);
  assert.equal(metrics.missedOutcomes, 1);
  assert.equal(typeof metrics.streakCount, "number");
  assert.equal(typeof metrics.executionScore, "number");
}

function main() {
  testWeeklyOutcomeMutability();
  testBlockedTaskValidation();
  testMilestoneCounters();
  testExecutionScoreDerivation();
  console.log("Phase 3.1 behavior smoke PASSED");
}

main();
