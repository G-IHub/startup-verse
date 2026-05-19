import mongoose from "mongoose";
import CohortMembership from "../models/CohortMembership.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import Milestone from "../models/Milestone.js";
import {
  daysAgoDate,
  weekKeysTrailing,
} from "./cohortWeekUtils.js";
import { TASK_WINDOW_DAYS, WEEKLY_EXECUTION_WEEKS } from "./portfolioHealthScoring.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

/**
 * Batch-load per-founder metrics for portfolio-health scoring.
 */
export async function loadPortfolioHealthAggregates(cohortId) {
  const memberships = await CohortMembership.find({ cohortId }).lean();
  const founderIds = [
    ...new Set(memberships.map((m) => toIdString(m.founderId)).filter(Boolean)),
  ];
  const startupIds = [
    ...new Set(memberships.map((m) => toIdString(m.startupId)).filter(Boolean)),
  ];

  if (founderIds.length === 0) {
    return {
      memberships: [],
      founderIds: [],
      aggregatesByFounderId: new Map(),
      displayByFounderId: new Map(),
    };
  }

  const now = new Date();
  const weekKeys = weekKeysTrailing(WEEKLY_EXECUTION_WEEKS, now);
  const fourWeeksAgo = new Date(weekKeys[weekKeys.length - 1]);
  const fourteenDaysAgo = daysAgoDate(TASK_WINDOW_DAYS, now);

  const founderObjectIds = founderIds.map((id) => new mongoose.Types.ObjectId(id));
  const startupObjectIds = startupIds.map((id) => new mongoose.Types.ObjectId(id));

  const [
    weeklyOutcomeRows,
    taskRows,
    activityRows,
    milestoneRows,
    users,
    startups,
  ] = await Promise.all([
    WeeklyOutcome.find(
      { founderId: { $in: founderObjectIds }, weekOf: { $gte: fourWeeksAgo } },
      { founderId: 1, weekOf: 1, status: 1 },
    ).lean(),
    Task.aggregate([
      {
        $match: {
          founderId: { $in: founderObjectIds },
          updatedAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: "$founderId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),
    Activity.aggregate([
      {
        $match: {
          startupId: { $in: startupObjectIds },
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      { $group: { _id: "$startupId", count: { $sum: 1 } } },
    ]),
    Milestone.aggregate([
      { $match: { founderId: { $in: founderObjectIds } } },
      {
        $group: {
          _id: "$founderId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),
    User.find(
      { _id: { $in: founderObjectIds } },
      { name: 1, email: 1 },
    ).lean(),
    Startup.find(
      {
        $or: [
          { founderId: { $in: founderObjectIds } },
          ...(startupIds.length ? [{ _id: { $in: startupObjectIds } }] : []),
        ],
      },
      { name: 1, founderId: 1 },
    ).lean(),
  ]);

  const weeklyByFounder = new Map();
  for (const wo of weeklyOutcomeRows) {
    const fid = toIdString(wo.founderId);
    if (!fid) continue;
    if (!weeklyByFounder.has(fid)) weeklyByFounder.set(fid, []);
    weeklyByFounder.get(fid).push(wo);
  }

  const tasksByFounder = new Map(
    taskRows.map((r) => [
      toIdString(r._id),
      { completed: r.completed || 0, total: r.total || 0 },
    ]),
  );

  const activityByStartup = new Map(
    activityRows.map((r) => [toIdString(r._id), r.count || 0]),
  );

  const milestonesByFounder = new Map(
    milestoneRows.map((r) => [
      toIdString(r._id),
      { completed: r.completed || 0, total: r.total || 0 },
    ]),
  );

  const startupIdByFounder = new Map(
    memberships.map((m) => [toIdString(m.founderId), toIdString(m.startupId)]),
  );

  const userById = new Map(users.map((u) => [toIdString(u._id), u]));
  const startupById = new Map();
  const startupByFounderId = new Map();
  for (const s of startups) {
    startupById.set(toIdString(s._id), s);
    if (s.founderId) startupByFounderId.set(toIdString(s.founderId), s);
  }

  const aggregatesByFounderId = new Map();
  const displayByFounderId = new Map();

  for (const fid of founderIds) {
    const startupId = startupIdByFounder.get(fid);
    aggregatesByFounderId.set(fid, {
      weeklyOutcomes: weeklyByFounder.get(fid) || [],
      tasks: tasksByFounder.get(fid) || { completed: 0, total: 0 },
      activityCount: activityByStartup.get(startupId) || 0,
      milestones: milestonesByFounder.get(fid) || { completed: 0, total: 0 },
    });

    const user = userById.get(fid);
    const startup =
      startupById.get(startupId) || startupByFounderId.get(fid) || null;
    displayByFounderId.set(fid, {
      startupName: startup?.name || "Unnamed Startup",
      founderName: user?.name || user?.email || "Founder",
    });
  }

  return {
    memberships,
    founderIds,
    aggregatesByFounderId,
    displayByFounderId,
  };
}
