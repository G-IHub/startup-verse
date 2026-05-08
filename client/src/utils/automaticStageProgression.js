/**
 * Legacy automatic stage progression (deprecated client heuristics).
 * Journey stage is now persisted on the server via GET/PUT /founders/:id/journey.
 */

export function gatherCurrentMetrics() {
  return {
    completedOutcomes: 0,
    completedMilestones: 0,
    weeklyStreak: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamSize: 1,
    activeUsers: 0,
    customerCount: 0,
    monthlyRevenue: 0,
  };
}

export function checkAndProgressStage() {
  return false;
}

export function checkStageProgressionWithThreshold() {
  return false;
}

export function onWeeklyOutcomeCompleted() {
  /* no-op: server-backed journey */
}

export function onMilestoneCompleted() {
  /* no-op */
}

export function onTaskCompleted() {
  /* no-op */
}

export function onTeamMemberAdded() {
  /* no-op */
}

export function onMetricsUpdated() {
  /* no-op */
}

export function initializeStageProgressionCheck() {
  /* no-op */
}
