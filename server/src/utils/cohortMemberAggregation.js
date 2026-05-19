import mongoose from "mongoose";
import CohortMembership from "../models/CohortMembership.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import Activity from "../models/Activity.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import { classifyActivity } from "./cohortActivityClassifier.js";
import { escapeRegex } from "./listQuery.js";
import {
  startOfWeekMondayUTC,
  daysAgoDate,
  computeWeeklyStreak,
} from "./cohortWeekUtils.js";

const DAY_MS = 86_400_000;
const STREAK_LOOKBACK_WEEKS = 8;

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

/**
 * Paginated membership query with optional text search on founder / startup.
 */
async function queryMembershipPage(cohortId, listOptions) {
  const cohortOid = new mongoose.Types.ObjectId(String(cohortId));
  const match = { cohortId: cohortOid };
  if (listOptions.status) {
    match.status = listOptions.status;
  }

  const { limit, skip, sort, q } = listOptions;

  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    const userCol = User.collection.name;
    const startupCol = Startup.collection.name;
    const [facet] = await CohortMembership.aggregate([
      { $match: match },
      {
        $lookup: {
          from: userCol,
          localField: "founderId",
          foreignField: "_id",
          as: "founderUser",
        },
      },
      {
        $lookup: {
          from: startupCol,
          localField: "startupId",
          foreignField: "_id",
          as: "startupDoc",
        },
      },
      { $unwind: { path: "$founderUser", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$startupDoc", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { "founderUser.name": regex },
            { "founderUser.email": regex },
            { "startupDoc.name": regex },
          ],
        },
      },
      {
        $facet: {
          meta: [{ $count: "total" }],
          rows: [
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            { $project: { founderUser: 0, startupDoc: 0 } },
          ],
        },
      },
    ]);
    const total = facet?.meta?.[0]?.total ?? 0;
    const memberships = facet?.rows ?? [];
    return { memberships, total };
  }

  const [total, memberships] = await Promise.all([
    CohortMembership.countDocuments(match),
    CohortMembership.find(match).sort(sort).skip(skip).limit(limit).lean(),
  ]);
  return { memberships, total };
}

/**
 * Enrich a page of CohortMembership rows with User + Startup + progress.
 */
async function enrichMembershipRows(memberships) {
  if (!memberships.length) return [];

  const founderIds = [
    ...new Set(memberships.map((m) => toIdString(m.founderId)).filter(Boolean)),
  ];
  const membershipStartupIds = [
    ...new Set(memberships.map((m) => toIdString(m.startupId)).filter(Boolean)),
  ];

  const eightWeeksAgo = daysAgoDate(STREAK_LOOKBACK_WEEKS * 7);
  const weekStart = startOfWeekMondayUTC();

  const [
    users,
    startups,
    activityRows,
    weeklyOutcomeRows,
    milestoneCountRows,
    openMilestoneRows,
    taskCountRows,
  ] = await Promise.all([
    User.find(
      { _id: { $in: founderIds } },
      { name: 1, email: 1, avatarUrl: 1, role: 1 },
    ).lean(),
    Startup.find(
      {
        $or: [
          { founderId: { $in: founderIds } },
          ...(membershipStartupIds.length
            ? [{ _id: { $in: membershipStartupIds } }]
            : []),
        ],
      },
      { name: 1, description: 1, industry: 1, stage: 1, logo: 1, founderId: 1 },
    ).lean(),
    Activity.aggregate([
      { $match: { userId: { $in: founderIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$userId", lastActive: { $max: "$createdAt" } } },
    ]),
    WeeklyOutcome.find(
      { founderId: { $in: founderIds }, weekOf: { $gte: eightWeeksAgo } },
      { founderId: 1, weekOf: 1, status: 1 },
    )
      .sort({ weekOf: -1 })
      .lean(),
    Milestone.aggregate([
      { $match: { founderId: { $in: founderIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
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
    Milestone.find(
      { founderId: { $in: founderIds }, status: { $ne: "completed" } },
      { founderId: 1, title: 1, sequence: 1 },
    )
      .sort({ sequence: 1 })
      .lean(),
    Task.aggregate([
      {
        $match: {
          founderId: { $in: founderIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: "completed",
          updatedAt: { $gte: weekStart },
        },
      },
      { $group: { _id: "$founderId", count: { $sum: 1 } } },
    ]),
  ]);

  // Build the team-size aggregate once we know all startup ids (memberships +
  // founder-derived startups). Done separately so we can use the full set.
  const allStartupIds = new Set(membershipStartupIds);
  for (const s of startups) allStartupIds.add(toIdString(s._id));
  const teamSizeRows = allStartupIds.size
    ? await TeamMemberProfile.aggregate([
        {
          $match: {
            startupId: {
              $in: [...allStartupIds].map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        { $group: { _id: "$startupId", count: { $sum: 1 } } },
      ])
    : [];

  // Index everything by id for O(1) lookup while assembling DTOs.
  const userById = new Map(users.map((u) => [toIdString(u._id), u]));

  const startupById = new Map();
  const startupByFounderId = new Map();
  for (const s of startups) {
    startupById.set(toIdString(s._id), s);
    if (s.founderId) startupByFounderId.set(toIdString(s.founderId), s);
  }

  const lastActiveByFounder = new Map(
    activityRows.map((r) => [toIdString(r._id), r.lastActive]),
  );

  const weeklyOutcomesByFounder = new Map();
  for (const wo of weeklyOutcomeRows) {
    const fid = toIdString(wo.founderId);
    if (!fid) continue;
    if (!weeklyOutcomesByFounder.has(fid)) weeklyOutcomesByFounder.set(fid, []);
    weeklyOutcomesByFounder.get(fid).push(wo);
  }

  const milestoneCountsByFounder = new Map(
    milestoneCountRows.map((r) => [
      toIdString(r._id),
      { total: r.total || 0, completed: r.completed || 0 },
    ]),
  );

  // First (lowest-sequence) open milestone wins per founder.
  const currentMilestoneByFounder = new Map();
  for (const m of openMilestoneRows) {
    const fid = toIdString(m.founderId);
    if (!fid || currentMilestoneByFounder.has(fid)) continue;
    currentMilestoneByFounder.set(fid, m.title || null);
  }

  const tasksThisWeekByFounder = new Map(
    taskCountRows.map((r) => [toIdString(r._id), r.count || 0]),
  );

  const teamSizeByStartup = new Map(
    teamSizeRows.map((r) => [toIdString(r._id), r.count || 0]),
  );

  return memberships.map((m) => {
    const founderId = toIdString(m.founderId);
    const user = userById.get(founderId) || null;
    const startup =
      startupById.get(toIdString(m.startupId)) ||
      startupByFounderId.get(founderId) ||
      null;

    const lastActive = lastActiveByFounder.get(founderId) || null;
    const milestoneCounts =
      milestoneCountsByFounder.get(founderId) || { total: 0, completed: 0 };
    const startupIdStr = startup ? toIdString(startup._id) : "";
    const teamMemberCount = startupIdStr
      ? teamSizeByStartup.get(startupIdStr) || 0
      : 0;

    return {
      id: toIdString(m._id),
      cohortId: toIdString(m.cohortId),
      joinedAt: m.joinedAt || m.createdAt || null,
      status: m.status || "active",

      founderId,
      founderName: user?.name || "",
      founderEmail: user?.email || "",
      currentStage: startup?.stage || "",

      founder: user
        ? {
            id: founderId,
            name: user.name || "",
            email: user.email || "",
            avatarUrl: user.avatarUrl || "",
            role: user.role || "founder",
          }
        : null,

      startupId: startupIdStr || null,
      startupName: startup?.name || "",
      startup: startup
        ? {
            id: startupIdStr,
            name: startup.name || "",
            description: startup.description || "",
            industry: startup.industry || "",
            stage: startup.stage || "",
            logoUrl: startup.logo || "",
          }
        : null,

      progress: {
        activityStatus: classifyActivity(lastActive),
        weeklyOutcomeStreak: computeWeeklyStreak(
          weeklyOutcomesByFounder.get(founderId) || [],
          STREAK_LOOKBACK_WEEKS,
        ),
        completedMilestones: milestoneCounts.completed,
        totalMilestones: milestoneCounts.total,
        tasksCompletedThisWeek: tasksThisWeekByFounder.get(founderId) || 0,
        lastActive: lastActive ? new Date(lastActive).toISOString() : null,
        currentMilestone: currentMilestoneByFounder.get(founderId) || null,
        teamSize: teamMemberCount + 1,
      },
    };
  });
}

/**
 * Step 3.1 — paginated, searchable cohort member list with enrichment.
 */
export async function loadCohortMembersEnriched(cohortId, listOptions) {
  const empty = {
    items: [],
    total: 0,
    limit: listOptions?.limit ?? 25,
    skip: listOptions?.skip ?? 0,
  };

  if (!cohortId || !mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return empty;
  }

  const { memberships, total } = await queryMembershipPage(cohortId, listOptions);
  if (!memberships.length) {
    return { ...empty, total };
  }

  const items = await enrichMembershipRows(memberships);
  return {
    items,
    total,
    limit: listOptions.limit,
    skip: listOptions.skip,
  };
}

/** Max rows for GET /cohorts/:cohortId/export (Step 4.1). */
export const EXPORT_MAX_MEMBERS = 500;

/**
 * Load enriched cohort members for export (no search filter; capped at EXPORT_MAX_MEMBERS).
 */
export async function loadCohortMembersForExport(cohortId) {
  const listOptions = {
    q: "",
    limit: EXPORT_MAX_MEMBERS,
    skip: 0,
    sort: { joinedAt: -1 },
    sortBy: "joinedAt",
    sortOrder: "desc",
    status: "",
    extraFilters: {},
  };
  return loadCohortMembersEnriched(cohortId, listOptions);
}
