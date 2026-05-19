import { daysAgoDate } from "./cohortWeekUtils.js";

export const ANALYTICS_RANGES = ["30d", "90d", "all"];
export const DEFAULT_ANALYTICS_RANGE = "90d";

/**
 * @param {Record<string, unknown>} query
 * @returns {{ range: string, since: Date|null }}
 */
export function parseAnalyticsRange(query = {}) {
  const raw = String(query?.range ?? DEFAULT_ANALYTICS_RANGE).trim().toLowerCase();
  const range = ANALYTICS_RANGES.includes(raw) ? raw : DEFAULT_ANALYTICS_RANGE;

  if (range === "30d") return { range, since: daysAgoDate(30) };
  if (range === "90d") return { range, since: daysAgoDate(90) };
  return { range: "all", since: null };
}
