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

const DAY_MS = 86_400_000;
const STREAK_LOOKBACK_WEEKS = 8;
const STREAK_QUALIFYING_STATUSES = new Set(["completed", "partial"]);

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

/** Monday 00:00:00 UTC of the week that contains `now`. */
function startOfWeekMondayUTC(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (dow + 6) % 7; // Sun -> 6, Mon -> 0, ...
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

/**
 * Count consecutive trailing weeks (ending with the current week) that have at
 * least one WeeklyOutcome with a qualifying status. Stop at the first gap.
 *
 * `weeklyOutcomes` is the founder's WeeklyOutcome rows from the last
 * STREAK_LOOKBACK_WEEKS weeks, in any order. We bucket by weekOf normalised to
 * a Monday-UTC boundary and walk backwards.
 */
function computeStreak(weeklyOutcomes) {
  if (!Array.isArray(weeklyOutcomes) || weeklyOutcomes.length === 0) return 0;

  const qualifyingWeekKeys = new Set();
  for (const wo of weeklyOutcomes) {
    if (!wo?.weekOf || !STREAK_QUALIFYING_STATUSES.has(String(wo.status))) continue;
    const weekStart = startOfWeekMondayUTC(new Date(wo.weekOf));
    qualifyingWeekKeys.add(weekStart.toISOString());
  }
  if (qualifyingWeekKeys.size === 0) return 0;

  let streak = 0;
  const cursor = startOfWeekMondayUTC();
  for (let i = 0; i < STREAK_LOOKBACK_WEEKS; i += 1) {
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

/**
 * Load all CohortMembership rows for a cohort, joined with each founder's User
 * + Startup + computed `progress` block. Single helper call → ~9 parallel DB
 * round-trips regardless of cohort size.
 *
 * Response shape per row (back-compat top-level mirrors + nested objects):
 *   id, cohortId, joinedAt, status,
 *   founderId, founderName, founderEmail, currentStage,
 *   founder { id, name, email, avatarUrl, role },
 *   startupId, startupName,
 *   startup { id, name, description, industry, stage, logoUrl } | null,
 *   progress {
 *     activityStatus, weeklyOutcomeStreak, completedMilestones, totalMilestones,
 *     tasksCompletedThisWeek, lastActive, currentMilestone, teamSize
 *   }
 */
export async function loadCohortMembersEnriched(cohortId) {
  if (!cohortId || !mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return [];
  }

  const memberships = await CohortMembership.find({ cohortId }).lean();
  if (memberships.length === 0) return [];

  const founderIds = [
    ...new Set(memberships.map((m) => toIdString(m.founderId)).filter(Boolean)),
  ];
  const membershipStartupIds = [
    ...new Set(memberships.map((m) => toIdString(m.startupId)).filter(Boolean)),
  ];

  const eightWeeksAgo = new Date(Date.now() - STREAK_LOOKBACK_WEEKS * 7 * DAY_MS);
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
        weeklyOutcomeStreak: computeStreak(weeklyOutcomesByFounder.get(founderId) || []),
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
