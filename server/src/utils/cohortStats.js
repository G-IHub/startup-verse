import mongoose from "mongoose";
import CohortMembership from "../models/CohortMembership.js";
import Activity from "../models/Activity.js";
import { classifyActivity } from "./cohortActivityClassifier.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

/**
 * The five disjoint counters returned for every cohort. Sum of the buckets
 * equals `totalStartups`; memberships with `status === "completed"` are NOT
 * also counted in active/slowing/stalled.
 */
export function zeroStats() {
  return {
    totalStartups: 0,
    activeStartups: 0,
    slowingStartups: 0,
    stalledStartups: 0,
    completedStartups: 0,
  };
}

/**
 * Roll up cohort-level activity stats for many cohorts at once. Always 2 DB
 * round-trips regardless of how many cohort ids are passed:
 *   1. CohortMembership.find — lean projection of all memberships in scope.
 *   2. Activity.aggregate    — max(createdAt) per distinct founder.
 *
 * Returns a Map keyed by cohort id (stringified) → stats object. Cohorts with
 * no memberships are still represented in the map with a `zeroStats()` value
 * so callers can do a single `.get(id)` lookup without falling back.
 *
 * @param {Array<mongoose.Types.ObjectId|string>} cohortIds
 * @returns {Promise<Map<string, ReturnType<typeof zeroStats>>>}
 */
export async function computeCohortStatsBatch(cohortIds) {
  const validIds = (cohortIds || []).filter(
    (id) => id && mongoose.Types.ObjectId.isValid(String(id)),
  );

  const statsByCohort = new Map();
  for (const id of validIds) statsByCohort.set(toIdString(id), zeroStats());
  if (validIds.length === 0) return statsByCohort;

  const memberships = await CohortMembership.find(
    { cohortId: { $in: validIds } },
    { cohortId: 1, founderId: 1, status: 1 },
  ).lean();
  if (memberships.length === 0) return statsByCohort;

  const founderIdStrings = [
    ...new Set(memberships.map((m) => toIdString(m.founderId)).filter(Boolean)),
  ];

  const activityRows = founderIdStrings.length
    ? await Activity.aggregate([
        {
          $match: {
            userId: {
              $in: founderIdStrings.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        { $group: { _id: "$userId", lastActive: { $max: "$createdAt" } } },
      ])
    : [];

  const lastActiveByFounder = new Map(
    activityRows.map((r) => [toIdString(r._id), r.lastActive]),
  );

  for (const m of memberships) {
    const cohortKey = toIdString(m.cohortId);
    const bucket = statsByCohort.get(cohortKey);
    if (!bucket) continue; // membership for a cohort we didn't ask about
    bucket.totalStartups += 1;
    if (m.status === "completed") {
      bucket.completedStartups += 1;
      continue;
    }
    const status = classifyActivity(
      lastActiveByFounder.get(toIdString(m.founderId)),
    );
    if (status === "active") bucket.activeStartups += 1;
    else if (status === "slowing") bucket.slowingStartups += 1;
    else bucket.stalledStartups += 1;
  }

  return statsByCohort;
}

/**
 * Thin single-cohort wrapper. Always returns a populated stats object — never
 * `undefined` — so callers can spread it onto a response payload directly.
 *
 * @param {mongoose.Types.ObjectId|string} cohortId
 * @returns {Promise<ReturnType<typeof zeroStats>>}
 */
export async function computeCohortStats(cohortId) {
  const map = await computeCohortStatsBatch([cohortId]);
  return map.get(toIdString(cohortId)) ?? zeroStats();
}
