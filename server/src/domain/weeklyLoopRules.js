export const FINAL_OUTCOME_STATUSES = new Set(["completed", "partial", "missed"]);

export function isFinalOutcomeStatus(status) {
  return FINAL_OUTCOME_STATUSES.has(String(status || "").toLowerCase());
}

export function ensureOutcomeMutable(existingOutcome) {
  if (!existingOutcome) return { ok: true };
  if (isFinalOutcomeStatus(existingOutcome.status)) {
    return {
      ok: false,
      code: 422,
      message: "WeeklyOutcome is immutable after final submission.",
      errors: ["Final outcomes (completed|partial|missed) cannot be modified."],
    };
  }
  return { ok: true };
}

export function validateBlockedTaskPayload(payload = {}) {
  const status = String(payload.status || "").toLowerCase();
  if (status !== "blocked") return { ok: true };
  const blockerReason = String(
    payload.blockerReason ?? payload.blockedReason ?? "",
  ).trim();
  const blockerNote = String(
    payload.blockerNote ?? payload.blockedNote ?? "",
  ).trim();
  if (!blockerReason || !blockerNote) {
    return {
      ok: false,
      code: 422,
      message: "Blocked tasks require blockerReason and blockerNote.",
    };
  }
  return { ok: true, blockerReason, blockerNote };
}

export function computeMilestoneCounters(tasks = []) {
  const totalTasks = tasks.length;
  const tasksCompleted = tasks.filter((task) => task.status === "completed").length;
  return { totalTasks, tasksCompleted };
}

export function computeExecutionScoreMetrics(tasks = [], outcomes = []) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const taskCompletionScore = totalTasks ? completedTasks / totalTasks : 0;
  const averageWeeklyScore = outcomes.length
    ? outcomes.reduce((sum, item) => sum + Number(item.score || 0), 0) / outcomes.length
    : 0;
  const executionScore = Number(
    ((taskCompletionScore * 70 + Math.min(averageWeeklyScore, 100) * 0.3) * 100 / 100).toFixed(2),
  );

  return {
    executionScore,
    taskCompletionScore: Number((taskCompletionScore * 100).toFixed(2)),
    averageWeeklyScore: Number(averageWeeklyScore.toFixed(2)),
    totalTasks,
    completedTasks,
    outcomeCount: outcomes.length,
  };
}
