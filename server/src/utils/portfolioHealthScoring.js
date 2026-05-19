import {
  QUALIFYING_WEEKLY_OUTCOME_STATUSES,
  weekKeyFromDate,
  weekKeysTrailing,
} from "./cohortWeekUtils.js";

export const PORTFOLIO_FACTOR_MAX = {
  weeklyExecution: 20,
  taskCompletion: 25,
  teamActivity: 25,
  milestoneProgress: 30,
};

export const TEAM_ACTIVITY_FULL_SCALE = 10;
export const TASK_WINDOW_DAYS = 14;
export const WEEKLY_EXECUTION_WEEKS = 4;

export function scoreWeeklyExecution(weeklyOutcomes, now = new Date()) {
  const targetKeys = new Set(weekKeysTrailing(WEEKLY_EXECUTION_WEEKS, now));
  const qualifyingKeys = new Set();
  for (const wo of weeklyOutcomes || []) {
    if (!wo?.weekOf || !QUALIFYING_WEEKLY_OUTCOME_STATUSES.has(String(wo.status))) {
      continue;
    }
    const key = weekKeyFromDate(wo.weekOf);
    if (targetKeys.has(key)) qualifyingKeys.add(key);
  }
  const qualifyingWeeks = qualifyingKeys.size;
  return Math.round(
    (qualifyingWeeks / WEEKLY_EXECUTION_WEEKS) * PORTFOLIO_FACTOR_MAX.weeklyExecution,
  );
}

export function scoreTaskCompletion({ completed = 0, total = 0 }) {
  if (!total) return 0;
  return Math.round((completed / total) * PORTFOLIO_FACTOR_MAX.taskCompletion);
}

export function scoreTeamActivity(eventCount = 0) {
  const ratio = Math.min(eventCount / TEAM_ACTIVITY_FULL_SCALE, 1);
  return Math.round(ratio * PORTFOLIO_FACTOR_MAX.teamActivity);
}

export function scoreMilestoneProgress({ completed = 0, total = 0 }) {
  if (!total) return 0;
  return Math.round((completed / total) * PORTFOLIO_FACTOR_MAX.milestoneProgress);
}

export function computeHealthScore(factors) {
  return (
    (factors?.weeklyExecution ?? 0) +
    (factors?.taskCompletion ?? 0) +
    (factors?.teamActivity ?? 0) +
    (factors?.milestoneProgress ?? 0)
  );
}

export function deriveHealthStatus(score) {
  if (score < 40) return "critical";
  if (score < 70) return "warning";
  return "healthy";
}

export function buildPortfolioRow({
  founderId,
  startupName,
  founderName,
  aggregates,
  now = new Date(),
}) {
  const weeklyOutcomes = aggregates?.weeklyOutcomes ?? [];
  const tasks = aggregates?.tasks ?? { completed: 0, total: 0 };
  const activityCount = aggregates?.activityCount ?? 0;
  const milestones = aggregates?.milestones ?? { completed: 0, total: 0 };

  const factors = {
    weeklyExecution: scoreWeeklyExecution(weeklyOutcomes, now),
    taskCompletion: scoreTaskCompletion(tasks),
    teamActivity: scoreTeamActivity(activityCount),
    milestoneProgress: scoreMilestoneProgress(milestones),
  };
  const score = computeHealthScore(factors);
  const status = deriveHealthStatus(score);

  return {
    founderId: String(founderId),
    startupName,
    founderName,
    health: { status, score, factors },
  };
}
