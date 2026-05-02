import mongoose from "mongoose";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import TeamMemberStatus from "../models/TeamMemberStatus.js";
import Interest from "../models/Interest.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
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

export const getTasks = async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.params.teamMemberId }).sort({ createdAt: -1 });
  return apiSuccess(res, tasks);
};

export const updateTask = async (req, res) => {
  const existingTask = await Task.findOne({
    _id: req.params.taskId,
    assignedTo: req.params.teamMemberId,
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

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "description")) {
    updates.description = req.body.description || "";
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
      actionUrl: `/?view=virtual-office&tab=tasks&taskId=${task._id}`,
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

  task.comments = [
    ...(task.comments || []),
    {
      by: req.params.teamMemberId,
      message: req.body?.message || "",
      at: new Date().toISOString(),
    },
  ];

  await task.save();
  return apiSuccess(res, task);
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
  const tasks = await Task.find({ assignedTo: req.params.teamMemberId });
  const completed = tasks.filter((task) => task.status === "completed").length;

  return apiSuccess(res, {
    teamMemberId: req.params.teamMemberId,
    totalTasks: tasks.length,
    completedTasks: completed,
    completionRate: tasks.length ? Number((completed / tasks.length).toFixed(2)) : 0,
  });
};

export const getFounderTeamMembers = async (req, res) => {
  const { founderId } = req.params;
  const isFounderOrAdmin = req.user?.isAdmin === true || req.user?.id === String(founderId);
  if (!isFounderOrAdmin) {
    return apiError(res, "Forbidden.", 403);
  }

  const members = await User.find(
    { founderId, role: "team-member" },
    { name: 1, email: 1, avatarUrl: 1, role: 1, startupId: 1, founderId: 1, onboardingComplete: 1 },
  ).sort({ createdAt: -1 });

  const memberIds = members.map((m) => m._id);
  const profiles = memberIds.length
    ? await TeamMemberProfile.find({ userId: { $in: memberIds } }).lean()
    : [];
  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

  const result = members.map((m) => {
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
      startupId: String(m.founderId || founderId),
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
