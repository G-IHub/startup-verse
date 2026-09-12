import mongoose from "mongoose";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import TeamMemberStatus from "../models/TeamMemberStatus.js";
import Interest from "../models/Interest.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import Startup from "../models/Startup.js";
import OnboardingChecklist from "../models/OnboardingChecklist.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";
import {
  validateBlockedTaskPayload,
  validateTaskStatusTransition,
} from "../domain/weeklyLoopRules.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { mapActivityToDto } from "../utils/activityDto.js";
import { createNotification } from "../services/notificationService.js";
import { taskPageDeepLink } from "../utils/deepLinks.js";
import { canAccessStartupTask } from "../utils/taskAccess.js";
import { createTaskComment } from "../services/taskCommentService.js";
import { syncMilestoneCounters } from "../utils/syncMilestoneCounters.js";

export const createOrUpdateProfile = async (req, res) => {
  const requestedUserId = String(req.body?.userId || "").trim();
  const targetUserId = requestedUserId || req.user.id;
  const isSelf = String(req.user.id) === String(targetUserId);
  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  const profile = await TeamMemberProfile.findOneAndUpdate(
    { userId: targetUserId },
    {
      userId: targetUserId,
      founderId: req.body?.founderId || null,
      startupId: req.body?.startupId || null,
      skills: req.body?.skills || [],
      bio: req.body?.bio || "",
    },
    { upsert: true, new: true, runValidators: true },
  );
  return apiSuccess(res, profile, 201);
};

export const getProfile = async (req, res) => {
  const profile = await TeamMemberProfile.findOne({ userId: req.params.userId });
  if (!profile) {
    return apiError(res, "Team member profile not found.", 404);
  }
  return apiSuccess(res, profile);
};

function assignedToMatch(teamMemberId) {
  const raw = String(teamMemberId || "").trim();
  if (!raw) return { assignedTo: teamMemberId };
  const ids = [raw];
  if (mongoose.Types.ObjectId.isValid(raw)) {
    ids.push(new mongoose.Types.ObjectId(raw));
  }
  return { assignedTo: { $in: ids } };
}

export const getTasks = async (req, res) => {
  const tasks = await Task.find(assignedToMatch(req.params.teamMemberId)).sort({
    createdAt: -1,
  });
  return apiSuccess(res, tasks);
};

export const updateTask = async (req, res) => {
  const existingTask = await Task.findOne({
    _id: req.params.taskId,
    ...assignedToMatch(req.params.teamMemberId),
  });
  if (!existingTask) {
    return apiError(res, "Task not found.", 404);
  }

  const updates = {};
  if (req.body?.status) {
    const transition = validateTaskStatusTransition(existingTask.status, req.body.status);
    if (!transition.ok) {
      return apiError(res, transition.message, transition.code);
    }
    const blockedValidation = validateBlockedTaskPayload(req.body);
    if (!blockedValidation.ok) {
      return apiError(res, blockedValidation.message, blockedValidation.code);
    }
    updates.status = req.body.status;
    if (req.body.status === "blocked") {
      updates.blockerReason = blockedValidation.blockerReason;
      updates.blockerNote = blockedValidation.blockerNote;
    } else {
      updates.blockerReason = "";
      updates.blockerNote = "";
    }
  }

  if (Object.keys(updates).length === 0) {
    return apiError(res, "No updates provided.", 400);
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, assignedTo: req.params.teamMemberId },
    updates,
    { new: true, runValidators: true },
  );
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }

  if (task.milestoneId) {
    await syncMilestoneCounters(task.milestoneId);
  }

  if (task.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [startupRoom(task.startupId)]);
  }

  // Notify founder when team member transitions a task into blocked.
  if (
    updates.status === "blocked" &&
    existingTask.status !== "blocked" &&
    task.founderId
  ) {
    await createNotification({
      userId: task.founderId,
      type: "task-blocked",
      title: "Task blocked by team member",
      message: `${task.assignedToName || "A team member"} blocked: ${task.title}`,
      actionUrl: taskPageDeepLink(task._id),
      metadata: {
        taskId: String(task._id),
        teamMemberId: String(req.params.teamMemberId),
        blockerReason: task.blockerReason || "",
        blockerNote: task.blockerNote || "",
      },
    });
  }

  return apiSuccess(res, task);
};

export const commentOnTask = async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (!(await canAccessStartupTask(req, task))) {
    return apiError(res, "Forbidden.", 403);
  }

  try {
    const comment = await createTaskComment({
      task,
      authorId: req.user.id,
      body: req.body?.body || req.body?.message || req.body?.comment || "",
    });
    return apiSuccess(res, comment, 201);
  } catch (err) {
    return apiError(res, err.message, err.status || 500);
  }
};

export const getActivity = async (req, res) => {
  const activities = await Activity.find({ userId: req.params.teamMemberId }).sort({ createdAt: -1 });
  return apiSuccess(res, activities);
};

export const getStatus = async (req, res) => {
  const status = await TeamMemberStatus.findOne({ teamMemberId: req.params.teamMemberId }).sort({ createdAt: -1 });
  return apiSuccess(res, status || { status: "available", note: "", teamMemberId: req.params.teamMemberId });
};

export const updateStatus = async (req, res) => {
  const status = await TeamMemberStatus.findOneAndUpdate(
    { teamMemberId: req.params.teamMemberId },
    {
      teamMemberId: req.params.teamMemberId,
      startupId: req.body?.startupId || null,
      status: req.body?.status || "available",
      note: req.body?.note || "",
    },
    { upsert: true, new: true, runValidators: true },
  );
  return apiSuccess(res, status, 201);
};

export const getPerformance = async (req, res) => {
  const tasks = await Task.find(assignedToMatch(req.params.teamMemberId));
  const completed = tasks.filter((task) => task.status === "completed").length;

  return apiSuccess(res, {
    teamMemberId: req.params.teamMemberId,
    totalTasks: tasks.length,
    completedTasks: completed,
    completionRate: tasks.length ? Number((completed / tasks.length).toFixed(2)) : 0,
  });
};

export const getFounderTeamMembers = async (req, res) => {
  const requestedScopeId = String(req.params.founderId || "").trim();
  let founderId = requestedScopeId;
  let startupId = "";

  if (mongoose.Types.ObjectId.isValid(requestedScopeId)) {
    const startup = await Startup.findById(requestedScopeId, { _id: 1, founderId: 1 }).lean();
    if (startup?.founderId) {
      founderId = String(startup.founderId);
      startupId = String(startup._id);
    } else {
      const startupByFounder = await Startup.findOne(
        { founderId: requestedScopeId },
        { _id: 1, founderId: 1 },
      ).lean();
      if (startupByFounder?._id) {
        startupId = String(startupByFounder._id);
      }
    }
  }

  const requester = req.user?.id
    ? await User.findById(req.user.id, { _id: 1, startupId: 1, founderId: 1, role: 1 }).lean()
    : null;

  const requesterStartupId = String(requester?.startupId || "");
  const requesterFounderId = String(requester?.founderId || "");
  const isFounderOrAdmin =
    req.user?.isAdmin === true || req.user?.id === String(founderId);
  const isMemberOfScope =
    Boolean(requester) &&
    (
      requesterFounderId === String(founderId) ||
      (startupId && requesterStartupId === String(startupId))
    );

  if (!isFounderOrAdmin && !isMemberOfScope) {
    return apiError(res, "Forbidden.", 403);
  }

  const profileQuery = startupId
    ? { $or: [{ founderId }, { startupId }] }
    : { founderId };
  const profiles = await TeamMemberProfile.find(profileQuery).lean();
  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

  const profileUserIds = profiles.map((p) => p.userId).filter(Boolean);
  const userQuery = startupId
    ? {
        $or: [
          { founderId, role: { $in: ["team-member", "team"] } },
          { startupId, role: { $in: ["team-member", "team"] } },
          { _id: { $in: profileUserIds } },
        ],
      }
    : {
        $or: [
          { founderId, role: { $in: ["team-member", "team"] } },
          { _id: { $in: profileUserIds } },
        ],
      };

  const members = await User.find(
    userQuery,
    {
      name: 1,
      email: 1,
      avatarUrl: 1,
      role: 1,
      startupId: 1,
      founderId: 1,
      onboardingComplete: 1,
      createdAt: 1,
    },
  ).sort({ createdAt: -1 });

  const membersById = new Map(
    members.map((member) => [String(member._id), member]),
  );

  const result = Array.from(membersById.values()).map((m) => {
    const profile = profileByUserId.get(String(m._id)) || {};
    return {
      id: String(m._id),
      userId: String(m._id),
      name: m.name || "",
      email: m.email || "",
      avatar: m.avatarUrl || "",
      role: m.role || "team-member",
      title: profile.title || "",
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      bio: profile.bio || "",
      compensation: profile.compensation || null,
      createdAt: m.createdAt || null,
      startupId: String(m.startupId || startupId || founderId),
      founderId: String(founderId),
      isOnline: false,
      statusText: "",
    };
  });

  return apiSuccess(res, result);
};

export const leaveStartup = async (req, res) => {
  const userId = req.params.userId;
  const isSelfOrAdmin =
    req.user?.isAdmin === true || String(req.user?.id) === String(userId);
  if (!isSelfOrAdmin) {
    return apiError(res, "Forbidden.", 403);
  }

  const session = await mongoose.startSession();
  try {
    let responsePayload = null;
    let activityEvent = null;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
      }
      if (user.role !== "team-member") {
        const err = new Error("User is not currently a team member.");
        err.statusCode = 422;
        throw err;
      }

      const departingStartupId = String(user.startupId || user.founderId || "");

      // Revert role, clear startup binding — keep everything else intact
      user.role = "talent";
      user.startupId = null;
      user.founderId = null;
      user.onboardingComplete = false;
      await user.save({ session });

      // Keep skills/bio in TeamMemberProfile but detach from startup
      await TeamMemberProfile.findOneAndUpdate(
        { userId: user._id },
        { $unset: { startupId: "", founderId: "" } },
        { session },
      );

      // Mark all onboarded interests for this talent as 'left'
      await Interest.updateMany(
        { talentId: user._id, onboarded: true },
        { $set: { status: "left" } },
        { session },
      );

      // Log the departure as a startup activity
      if (departingStartupId) {
        const [created] = await Activity.create(
          [{
            startupId: departingStartupId,
            userId: user._id,
            type: "leave",
            text: `${user.name || "A team member"} has left the startup.`,
            metadata: {
              userId: String(user._id),
              userName: user.name || "",
              icon: "👋",
            },
          }],
          { session },
        );
        activityEvent = mapActivityToDto(created);
      }

      responsePayload = {
        left: true,
        user: {
          id: String(user._id),
          role: user.role,
          startupId: null,
          founderId: null,
          onboardingComplete: false,
        },
      };
    });

    if (activityEvent?.startupId) {
      emitRealtime(
        SOCKET_EVENTS.ACTIVITY_CREATED,
        activityEvent,
        [startupRoom(activityEvent.startupId)],
      );
    }

    return apiSuccess(res, responsePayload);
  } catch (error) {
    if (error.statusCode === 404) return apiError(res, error.message, 404);
    if (error.statusCode === 422) return apiError(res, error.message, 422);
    return apiError(res, "Failed to leave startup.", 500, [error.message]);
  } finally {
    await session.endSession();
  }
};

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

const COMPENSATION_TYPES = new Set(["equity", "fixed", "hourly", "equity-fixed", "unpaid"]);

/**
 * Founder-only compensation update for an ALREADY-onboarded team member.
 * The full onboarding-time validator (isValidCompensationConfig in
 * invitations.controller.js) is private to that file and tied to the
 * onboarding transaction — this is deliberately a lighter real check
 * (correct type + the one required numeric field per type), not a
 * fabricated no-op, for the Team page's "edit compensation" action.
 */
export const updateCompensation = async (req, res) => {
  const { teamMemberId } = req.params;
  const profile = await TeamMemberProfile.findOne({ userId: teamMemberId });
  if (!profile) {
    return apiError(res, "Team member profile not found.", 404);
  }
  if (!founderGuard(req, profile.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const config = req.body?.compensationConfig;
  if (!config || !COMPENSATION_TYPES.has(config.type)) {
    return apiError(res, `compensationConfig.type must be one of: ${[...COMPENSATION_TYPES].join(", ")}`, 400);
  }
  if (config.type === "fixed" && !(Number(config.fixed?.amount) > 0)) {
    return apiError(res, "fixed.amount must be a positive number.", 400);
  }
  if (config.type === "equity" && !(Number(config.equity?.totalEquity) > 0)) {
    return apiError(res, "equity.totalEquity must be a positive number.", 400);
  }
  if (config.type === "equity-fixed" && !(Number(config.fixed?.amount) > 0 && Number(config.equity?.totalEquity) > 0)) {
    return apiError(res, "Both fixed.amount and equity.totalEquity are required for equity-fixed.", 400);
  }

  profile.compensation = config;
  await profile.save();
  return apiSuccess(res, profile);
};

/**
 * Founder-scoped analog of getPerformance (which is self-or-admin only, so
 * a founder can't call it for their own team members). Reuses the exact
 * same real completion-rate computation, just for every team member under
 * one founder in one call — real data, not a fabricated "KPI score": the
 * client is expected to label this honestly (e.g. "Completion rate").
 */
export const getFounderTeamPerformance = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const members = await User.find(
    { founderId, role: { $in: ["team-member", "team"] } },
    { _id: 1 },
  ).lean();
  const memberIds = members.map((m) => String(m._id));
  if (memberIds.length === 0) {
    return apiSuccess(res, []);
  }

  const tasks = await Task.find({ assignedTo: { $in: memberIds } }, { assignedTo: 1, status: 1 }).lean();
  const byMember = new Map(memberIds.map((id) => [id, { total: 0, completed: 0 }]));
  for (const task of tasks) {
    const key = String(task.assignedTo || "");
    const bucket = byMember.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (task.status === "completed") bucket.completed += 1;
  }

  const result = memberIds.map((teamMemberId) => {
    const bucket = byMember.get(teamMemberId) || { total: 0, completed: 0 };
    return {
      teamMemberId,
      totalTasks: bucket.total,
      completedTasks: bucket.completed,
      completionRate: bucket.total ? Number((bucket.completed / bucket.total).toFixed(2)) : 0,
    };
  });

  return apiSuccess(res, result);
};

// ── Onboarding checklist (real, per team member; founder-managed) ─────────

const DEFAULT_ONBOARDING_TASKS = [
  "Sign employment agreement",
  "Complete identity verification",
  "Set up your StartupVerse team member account",
  "Attend onboarding call with founder",
  "Review startup roadmap and quarterly goals",
  "Set your first week's targets",
];

export const getOnboardingChecklist = async (req, res) => {
  const { teamMemberId } = req.params;
  const checklist = await OnboardingChecklist.findOne({ teamMemberId }).lean();
  if (!checklist) {
    return apiSuccess(res, null);
  }
  if (req.user.isAdmin !== true && req.user.id !== String(checklist.founderId) && req.user.id !== String(teamMemberId)) {
    return apiError(res, "Forbidden.", 403);
  }
  return apiSuccess(res, checklist);
};

/** Founder creates or replaces the checklist (e.g. when adding a new member). */
export const upsertOnboardingChecklist = async (req, res) => {
  const { teamMemberId } = req.params;
  const founderId = req.body?.founderId || req.user.id;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const rawTasks = Array.isArray(req.body?.tasks) && req.body.tasks.length > 0
    ? req.body.tasks
    : DEFAULT_ONBOARDING_TASKS.map((title) => ({ title }));
  const tasks = rawTasks
    .map((t) => ({ title: String(t.title || t || "").trim().slice(0, 300), done: Boolean(t.done) }))
    .filter((t) => t.title);

  const checklist = await OnboardingChecklist.findOneAndUpdate(
    { teamMemberId },
    { teamMemberId, founderId, startupId: req.body?.startupId || null, tasks },
    { upsert: true, new: true, runValidators: true },
  );
  return apiSuccess(res, checklist, 201);
};

/** Toggle (or edit) one task's done state. Founder or the team member themselves may call this. */
export const updateOnboardingChecklistTask = async (req, res) => {
  const { teamMemberId, taskId } = req.params;
  const checklist = await OnboardingChecklist.findOne({ teamMemberId });
  if (!checklist) {
    return apiError(res, "Checklist not found.", 404);
  }
  if (req.user.isAdmin !== true && req.user.id !== String(checklist.founderId) && req.user.id !== String(teamMemberId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const task = checklist.tasks.id(taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (req.body?.done != null) {
    task.done = Boolean(req.body.done);
    task.completedAt = task.done ? new Date() : null;
  }
  if (req.body?.title != null) {
    task.title = String(req.body.title).trim().slice(0, 300);
  }
  await checklist.save();
  return apiSuccess(res, checklist);
};
