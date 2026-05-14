const DAY_MS = 86_400_000;

export const ACTIVITY_ACTIVE_MAX_DAYS = 7;
export const ACTIVITY_SLOWING_MAX_DAYS = 21;

/**
 * Classify a founder's recency-of-activity bucket from their most recent
 * Activity timestamp. Used by both the per-member enrichment helper and the
 * cohort-stats roll-up so the two endpoints can never disagree.
 *
 * @param {Date|string|number|null|undefined} lastActiveDate
 * @returns {"active" | "slowing" | "stalled"}
 */
export function classifyActivity(lastActiveDate) {
  if (!lastActiveDate) return "stalled";
  const ms = Date.now() - new Date(lastActiveDate).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "stalled";
  const days = ms / DAY_MS;
  if (days <= ACTIVITY_ACTIVE_MAX_DAYS) return "active";
  if (days <= ACTIVITY_SLOWING_MAX_DAYS) return "slowing";
  return "stalled";
}
