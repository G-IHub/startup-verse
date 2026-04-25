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

const ALLOWED_TASK_TRANSITIONS = Object.freeze({
  pending: new Set(["pending", "in-progress", "blocked"]),
  "in-progress": new Set(["in-progress", "pending", "blocked", "completed"]),
  blocked: new Set(["blocked", "pending", "in-progress"]),
  completed: new Set(["completed", "pending"]),
});

export function validateTaskStatusTransition(fromStatus, toStatus) {
  const from = String(fromStatus || "pending").toLowerCase();
  const to = String(toStatus || "").toLowerCase();
  if (!to) return { ok: false, code: 422, message: "status is required." };
  const allowedTargets = ALLOWED_TASK_TRANSITIONS[from] || new Set();
  if (!allowedTargets.has(to)) {
    return {
      ok: false,
      code: 422,
      message: `Invalid task status transition: ${from} -> ${to}.`,
    };
  }
  return { ok: true };
}

export function computeMilestoneCounters(tasks = []) {
  const totalTasks = tasks.length;
  const tasksCompleted = tasks.filter((task) => task.status === "completed").length;
  return { totalTasks, tasksCompleted };
}

export function computeExecutionScoreMetrics(tasks = [], outcomes = []) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const taskCompletionPct = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
  const completedOutcomes = outcomes.filter((o) => o.status === "completed").length;
  const partialOutcomes = outcomes.filter((o) => o.status === "partial").length;
  const missedOutcomes = outcomes.filter((o) => o.status === "missed").length;
  const outcomeCount = outcomes.length;
  const outcomeHistoryPct = outcomeCount
    ? ((completedOutcomes + partialOutcomes * 0.5) / outcomeCount) * 100
    : 0;

  const orderedOutcomes = [...outcomes].sort(
    (a, b) => new Date(b.weekOf || b.createdAt || 0) - new Date(a.weekOf || a.createdAt || 0),
  );
  let streakCount = 0;
  for (const outcome of orderedOutcomes) {
    if (outcome.status === "completed") {
      streakCount += 1;
      continue;
    }
    if (outcome.status === "partial") {
      continue;
    }
    if (outcome.status === "missed") {
      streakCount = 0;
    }
    break;
  }
  const streakBonusPct = Math.min(streakCount * 5, 25);
  const executionScore = Number(
    (taskCompletionPct * 0.5 + outcomeHistoryPct * 0.35 + streakBonusPct * 0.15).toFixed(2),
  );

  return {
    executionScore,
    streakCount,
    taskCompletionScore: Number(taskCompletionPct.toFixed(2)),
    outcomeHistoryScore: Number(outcomeHistoryPct.toFixed(2)),
    streakBonusScore: Number(streakBonusPct.toFixed(2)),
    totalTasks,
    completedTasks,
    totalOutcomes: outcomeCount,
    completedOutcomes,
    partialOutcomes,
    missedOutcomes,
  };
}
