const DAY_MS = 86_400_000;

export const QUALIFYING_WEEKLY_OUTCOME_STATUSES = new Set(["completed", "partial"]);

/** Monday 00:00:00 UTC of the week that contains `now`. */
export function startOfWeekMondayUTC(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay();
  const daysSinceMonday = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

/** ISO week-start key for bucketing a `weekOf` / activity date. */
export function weekKeyFromDate(date) {
  return startOfWeekMondayUTC(new Date(date)).toISOString();
}

/**
 * Week-start keys for the current week and the prior `count - 1` weeks (newest first).
 */
export function weekKeysTrailing(count, now = new Date()) {
  const keys = [];
  const cursor = startOfWeekMondayUTC(now);
  for (let i = 0; i < count; i += 1) {
    keys.push(cursor.toISOString());
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return keys;
}

export function daysAgoDate(days, now = new Date()) {
  return new Date(now.getTime() - days * DAY_MS);
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Chart-friendly label from a Monday-UTC week-start ISO string. */
export function formatWeekLabel(weekStartIso) {
  const d = new Date(weekStartIso);
  return `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/**
 * Consecutive trailing weeks (ending with the current week) with at least one
 * qualifying WeeklyOutcome. Stops at the first gap.
 */
export function computeWeeklyStreak(weeklyOutcomes, lookbackWeeks = 8, now = new Date()) {
  if (!Array.isArray(weeklyOutcomes) || weeklyOutcomes.length === 0) return 0;

  const qualifyingWeekKeys = new Set();
  for (const wo of weeklyOutcomes) {
    if (!wo?.weekOf || !QUALIFYING_WEEKLY_OUTCOME_STATUSES.has(String(wo.status))) {
      continue;
    }
    qualifyingWeekKeys.add(weekKeyFromDate(wo.weekOf));
  }
  if (qualifyingWeekKeys.size === 0) return 0;

  let streak = 0;
  const cursor = startOfWeekMondayUTC(now);
  for (let i = 0; i < lookbackWeeks; i += 1) {
    const key = cursor.toISOString();
    if (qualifyingWeekKeys.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    } else {
      break;
    }
  }
  return streak;
}
