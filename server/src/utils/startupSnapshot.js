import mongoose from "mongoose";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import CohortMembership from "../models/CohortMembership.js";
import Cohort from "../models/Cohort.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import MentorProfile from "../models/MentorProfile.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Task from "../models/Task.js";
import Milestone from "../models/Milestone.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import Activity from "../models/Activity.js";
import { classifyActivity } from "./cohortActivityClassifier.js";
import { normalizeJourney } from "../domain/founderJourney.js";
import { computeWeeklyStreak, startOfWeekMondayUTC } from "./cohortWeekUtils.js";

const DAY_MS = 86_400_000;
const STREAK_LOOKBACK_WEEKS = 8;
const ACTIVITY_WINDOW_DAYS = 30;
/** Top contributor share above this ratio flips `contributionBalance.isBalanced` to false. */
export const CONTRIBUTION_BALANCED_MAX_SHARE = 0.6;

const STAGE_NAMES = {
  1: "Ideation",
  2: "Validation",
  3: "Building",
  4: "Team Building",
  5: "Growth",
  6: "Scale",
};

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

function isObjectIdLike(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

/**
 * Pure helper. Given a list of contributors with `{ id, name, completed }`,
 * pick the top contributor and decide whether the team load looks balanced.
 *
 * `isBalanced` is true when the top contributor's share of completed tasks is
 * at most `CONTRIBUTION_BALANCED_MAX_SHARE`. Solo teams (one contributor with
 * completions) are reported as the top contributor but flagged unbalanced —
 * the UI surfaces this as "single contributor dominating".
 */
export function computeContributionBalance(contributors) {
  const safe = Array.isArray(contributors) ? contributors.filter(Boolean) : [];
  const totalCompleted = safe.reduce(
    (acc, c) => acc + (Number(c.completed) || 0),
    0,
  );
  if (totalCompleted === 0) {
    return { topContributor: null, isBalanced: true };
  }
  let top = safe[0];
  for (const c of safe) {
    if ((Number(c.completed) || 0) > (Number(top.completed) || 0)) top = c;
  }
  const percentage = Math.round(((Number(top.completed) || 0) / totalCompleted) * 100);
  return {
    topContributor: {
      id: top.id || null,
      name: top.name || "Unknown",
      percentage,
    },
    isBalanced:
      (Number(top.completed) || 0) / totalCompleted <=
      CONTRIBUTION_BALANCED_MAX_SHARE,
  };
}

/**
 * Resolve `idOrFounderId` to a Startup document. Tries `_id` first then
 * `founderId` so both legacy callers (founderId in the URL) and the
 * canonical caller (startupId in the URL) work without ambiguity.
 */
async function resolveStartup(idOrFounderId) {
  if (!isObjectIdLike(idOrFounderId)) return null;
  const byId = await Startup.findById(idOrFounderId).lean();
  if (byId) return byId;
  return Startup.findOne({ founderId: idOrFounderId }).lean();
}

/**
 * Load the per-startup snapshot used by `StartupSnapshotModal`. Returns null
 * when the startup cannot be resolved. All aggregations run in parallel; on
 * a 5-person team with 30 days of task history this is ~9 DB round-trips
 * regardless of cohort size.
 */
export async function loadStartupSnapshot(idOrFounderId) {
  const startup = await resolveStartup(idOrFounderId);
  if (!startup) return null;

  const startupId = startup._id;
  const founderId = startup.founderId;

  const eightWeeksAgo = new Date(Date.now() - STREAK_LOOKBACK_WEEKS * 7 * DAY_MS);
  const thirtyDaysAgo = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * DAY_MS);
  const weekStart = startOfWeekMondayUTC();

  const [
    founderUser,
    teamMembers,
    latestMembership,
    weeklyOutcomeRows,
    latestActiveOutcome,
    milestoneCounts,
    openMilestone,
    taskWindowRows,
    tasksThisWeek,
    lastActivityRow,
  ] = await Promise.all([
    User.findById(founderId, { name: 1, email: 1, avatarUrl: 1 }).lean(),
    TeamMemberProfile.find({ startupId }, { userId: 1, founderId: 1, createdAt: 1 }).lean(),
    CohortMembership.findOne({ founderId })
      .sort({ joinedAt: -1, createdAt: -1 })
      .lean(),
    WeeklyOutcome.find(
      { founderId, weekOf: { $gte: eightWeeksAgo } },
      { weekOf: 1, status: 1 },
    )
      .sort({ weekOf: -1 })
      .lean(),
    WeeklyOutcome.findOne(
      { founderId, status: { $in: ["active", "in-progress"] } },
      { goal: 1, completionPercentage: 1 },
    )
      .sort({ weekOf: -1 })
      .lean(),
    Milestone.aggregate([
      { $match: { founderId: new mongoose.Types.ObjectId(String(founderId)) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),
    Milestone.findOne(
      { founderId, status: { $ne: "completed" } },
      { title: 1, sequence: 1, totalTasks: 1, tasksCompleted: 1 },
    )
      .sort({ sequence: 1 })
      .lean(),
    Task.aggregate([
      {
        $match: {
          startupId: new mongoose.Types.ObjectId(String(startupId)),
          updatedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            user: { $ifNull: ["$assignedTo", "$founderId"] },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Task.countDocuments({
      startupId,
      status: "completed",
      updatedAt: { $gte: weekStart },
    }),
    Activity.findOne({ startupId }, { createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Resolve team member user records for names.
  const memberUserIds = [
    ...new Set(teamMembers.map((m) => toIdString(m.userId)).filter(Boolean)),
  ];
  const memberUsers = memberUserIds.length
    ? await User.find(
        { _id: { $in: memberUserIds } },
        { name: 1, email: 1 },
      ).lean()
    : [];
  const memberUserById = new Map(
    memberUsers.map((u) => [toIdString(u._id), u]),
  );

  // Roll up the task window aggregate by user and by status.
  const totalsByUser = new Map(); // userId -> { total, completed }
  let totalTasks = 0;
  let completedTasks = 0;
  for (const row of taskWindowRows) {
    const userId = toIdString(row._id?.user);
    const status = row._id?.status;
    const count = row.count || 0;
    totalTasks += count;
    if (status === "completed") completedTasks += count;
    if (!userId) continue;
    const bucket = totalsByUser.get(userId) || { total: 0, completed: 0 };
    bucket.total += count;
    if (status === "completed") bucket.completed += count;
    totalsByUser.set(userId, bucket);
  }

  const founderIdStr = toIdString(founderId);
  const contributors = [];
  contributors.push({
    id: founderIdStr,
    name: founderUser?.name || "Founder",
    completed: totalsByUser.get(founderIdStr)?.completed || 0,
  });
  for (const m of teamMembers) {
    const uid = toIdString(m.userId);
    if (!uid || uid === founderIdStr) continue;
    const u = memberUserById.get(uid);
    contributors.push({
      id: uid,
      name: u?.name || "Team Member",
      completed: totalsByUser.get(uid)?.completed || 0,
    });
  }
  const contributionBalance = computeContributionBalance(contributors);

  const milestoneAgg = milestoneCounts?.[0] || { total: 0, completed: 0 };
  const journey = normalizeJourney(startup.data?.journey);

  const currentOutcome = openMilestone
    ? {
        title: openMilestone.title,
        progress:
          openMilestone.totalTasks > 0
            ? Math.round(
                ((openMilestone.tasksCompleted || 0) /
                  openMilestone.totalTasks) *
                  100,
              )
            : Number(latestActiveOutcome?.completionPercentage) || 0,
        milestonesComplete: openMilestone.tasksCompleted || 0,
        milestonesTotal: openMilestone.totalTasks || 0,
      }
    : latestActiveOutcome
      ? {
          title: latestActiveOutcome.goal || "Current Outcome",
          progress: Number(latestActiveOutcome.completionPercentage) || 0,
        }
      : null;

  const lastActivity = lastActivityRow?.createdAt || null;

  return {
    startupId: toIdString(startupId),
    startupName: startup.name || "",
    founderId: founderIdStr,
    founderName: founderUser?.name || "",
    founderEmail: founderUser?.email || "",
    status: classifyActivity(lastActivity),
    currentStage: String(journey.currentStage || 1),
    stageName: STAGE_NAMES[journey.currentStage] || "",
    teamSize: teamMembers.length + 1,
    joinedCohortAt:
      latestMembership?.joinedAt || latestMembership?.createdAt || null,
    lastActivity,
    executionSummary: {
      weeklyStreak: computeWeeklyStreak(weeklyOutcomeRows, STREAK_LOOKBACK_WEEKS),
      milestonesCompleted: milestoneAgg.completed || 0,
      totalMilestones: milestoneAgg.total || 0,
      tasksCompletedThisWeek: tasksThisWeek || 0,
      ...(currentOutcome ? { currentOutcome } : {}),
    },
    activitySummary: {
      totalTasks,
      completedTasks,
      lastActivityAt: lastActivity,
    },
    contributionBalance,
    teamMembers: teamMembers.map((m) => {
      const u = memberUserById.get(toIdString(m.userId));
      return {
        id: toIdString(m.userId),
        name: u?.name || "Team Member",
        role: "team-member",
        joinedAt: m.createdAt || null,
      };
    }),
  };
}

/**
 * Decide whether `user` may view `snapshot`. Allowed roles:
 *   - the founder themselves
 *   - any team member registered against the startup
 *   - any org admin of an organization that runs a cohort the founder
 *     is currently a member of
 *   - any mentor assigned to the founder via MentorProfile.assignedFounders
 *
 * Returns `true`/`false`. Caller is expected to enforce 403.
 */
export async function canViewStartupSnapshot(user, snapshot) {
  if (!user?.id || !snapshot) return false;
  const userId = String(user.id);
  const founderId = String(snapshot.founderId);
  const startupId = String(snapshot.startupId);

  if (userId === founderId) return true;

  const [teamHit, mentorHit, memberships] = await Promise.all([
    TeamMemberProfile.exists({ startupId, userId }),
    MentorProfile.exists({ userId, assignedFounders: founderId }),
    CohortMembership.find({ founderId }, { cohortId: 1 }).lean(),
  ]);
  if (teamHit) return true;
  if (mentorHit) return true;

  const cohortIds = [
    ...new Set(memberships.map((m) => toIdString(m.cohortId)).filter(Boolean)),
  ];
  if (cohortIds.length === 0) return false;
  const cohorts = await Cohort.find(
    { _id: { $in: cohortIds } },
    { organizationId: 1 },
  ).lean();
  const orgIds = [
    ...new Set(cohorts.map((c) => toIdString(c.organizationId)).filter(Boolean)),
  ];
  if (orgIds.length === 0) return false;
  const adminHit = await OrganizationAdmin.exists({
    organizationId: { $in: orgIds },
    userId,
  });
  return Boolean(adminHit);
}
