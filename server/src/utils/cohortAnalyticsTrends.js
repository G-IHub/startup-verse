import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Milestone from "../models/Milestone.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import {
  weekKeysTrailing,
  weekKeyFromDate,
  formatWeekLabel,
  computeWeeklyStreak,
} from "./cohortWeekUtils.js";

export const TREND_WEEK_COUNT = 8;

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

function emptyWeekSeries(weekKeys) {
  return weekKeys.map((weekStart) => ({
    weekStart,
    label: formatWeekLabel(weekStart),
    activityCount: 0,
  }));
}

function emptyVelocitySeries(weekKeys) {
  return weekKeys.map((weekStart) => ({
    weekStart,
    label: formatWeekLabel(weekStart),
    completedCount: 0,
  }));
}

export function buildEngagementByWeek(activityRows, weekKeys) {
  const counts = new Map(weekKeys.map((k) => [k, 0]));
  const keySet = new Set(weekKeys);
  for (const row of activityRows || []) {
    if (!row?.createdAt) continue;
    const key = weekKeyFromDate(row.createdAt);
    if (keySet.has(key)) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return weekKeys.map((weekStart) => ({
    weekStart,
    label: formatWeekLabel(weekStart),
    activityCount: counts.get(weekStart) || 0,
  }));
}

export function buildMilestoneVelocityByWeek(milestoneRows, weekKeys) {
  const counts = new Map(weekKeys.map((k) => [k, 0]));
  const keySet = new Set(weekKeys);
  for (const row of milestoneRows || []) {
    if (!row?.updatedAt) continue;
    const key = weekKeyFromDate(row.updatedAt);
    if (keySet.has(key)) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return weekKeys.map((weekStart) => ({
    weekStart,
    label: formatWeekLabel(weekStart),
    completedCount: counts.get(weekStart) || 0,
  }));
}

export function buildStreakHistogram(
  founderIds,
  weeklyOutcomesByFounder,
  lookbackWeeks = TREND_WEEK_COUNT,
  now = new Date(),
) {
  const buckets = Array.from({ length: lookbackWeeks + 1 }, (_, streakWeeks) => ({
    streakWeeks,
    founderCount: 0,
  }));

  for (const fid of founderIds || []) {
    const outcomes = weeklyOutcomesByFounder.get(fid) || [];
    const streak = computeWeeklyStreak(outcomes, lookbackWeeks, now);
    const idx = Math.min(streak, lookbackWeeks);
    buckets[idx].founderCount += 1;
  }

  return buckets;
}

export function buildCohortAnalyticsTrends({
  founderIds = [],
  activityRows = [],
  milestoneRows = [],
  weeklyOutcomeRows = [],
  now = new Date(),
}) {
  const weekKeys = weekKeysTrailing(TREND_WEEK_COUNT, now);

  if (founderIds.length === 0) {
    return {
      engagementByWeek: emptyWeekSeries(weekKeys),
      milestoneVelocityByWeek: emptyVelocitySeries(weekKeys),
      weeklyOutcomeStreakHistogram: buildStreakHistogram(
        [],
        new Map(),
        TREND_WEEK_COUNT,
        now,
      ),
    };
  }

  const weeklyOutcomesByFounder = new Map();
  for (const wo of weeklyOutcomeRows) {
    const fid = toIdString(wo.founderId);
    if (!fid) continue;
    if (!weeklyOutcomesByFounder.has(fid)) weeklyOutcomesByFounder.set(fid, []);
    weeklyOutcomesByFounder.get(fid).push(wo);
  }

  return {
    engagementByWeek: buildEngagementByWeek(activityRows, weekKeys),
    milestoneVelocityByWeek: buildMilestoneVelocityByWeek(milestoneRows, weekKeys),
    weeklyOutcomeStreakHistogram: buildStreakHistogram(
      founderIds,
      weeklyOutcomesByFounder,
      TREND_WEEK_COUNT,
      now,
    ),
  };
}

/**
 * Batch-load rows for 8-week trend series (fixed window, independent of analytics range).
 */
export async function loadCohortAnalyticsTrends({ founderIds, startupIds, now = new Date() }) {
  const weekKeys = weekKeysTrailing(TREND_WEEK_COUNT, now);
  const eightWeeksAgo = new Date(weekKeys[weekKeys.length - 1]);

  if (founderIds.length === 0) {
    return buildCohortAnalyticsTrends({ founderIds: [], now });
  }

  const founderObjectIds = founderIds.map((id) => new mongoose.Types.ObjectId(id));
  const startupObjectIds = startupIds.map((id) => new mongoose.Types.ObjectId(id));

  const [activityRows, milestoneRows, weeklyOutcomeRows] = await Promise.all([
    Activity.find(
      { startupId: { $in: startupObjectIds }, createdAt: { $gte: eightWeeksAgo } },
      { createdAt: 1 },
    ).lean(),
    Milestone.find(
      {
        founderId: { $in: founderObjectIds },
        status: "completed",
        updatedAt: { $gte: eightWeeksAgo },
      },
      { updatedAt: 1 },
    ).lean(),
    WeeklyOutcome.find(
      { founderId: { $in: founderObjectIds }, weekOf: { $gte: eightWeeksAgo } },
      { founderId: 1, weekOf: 1, status: 1 },
    ).lean(),
  ]);

  return buildCohortAnalyticsTrends({
    founderIds,
    activityRows,
    milestoneRows,
    weeklyOutcomeRows,
    now,
  });
}
