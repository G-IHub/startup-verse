import crypto from "crypto";
import FounderProfile from "../models/FounderProfile.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import StartupPost from "../models/StartupPost.js";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";
import Activity from "../models/Activity.js";
import Resource from "../models/Resource.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import {
  computeMilestoneCounters,
  ensureOutcomeMutable,
  validateBlockedTaskPayload,
} from "../domain/weeklyLoopRules.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";

// Helper for generic ownership defense
function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

function unwrapPayload(req, key) {
  const body = req.body || {};
  if (body && typeof body === "object" && body[key] && typeof body[key] === "object") {
    return body[key];
  }
  return body;
}

async function syncMilestoneCounters(milestoneId) {
  if (!milestoneId) return;
  const milestoneTasks = await Task.find({ milestoneId }, { status: 1 });
  const counters = computeMilestoneCounters(milestoneTasks);
  await Milestone.findByIdAndUpdate(
    milestoneId,
    counters,
    { new: false },
  );
}

async function appendLoopActivity({ founderId, startupId, type, text, metadata = {} }) {
  if (!startupId) return;
  const doc = await Activity.create({
    startupId,
    userId: founderId,
    type,
    text,
    metadata,
  });
  const sid = String(startupId);
  emitRealtime(
    SOCKET_EVENTS.ACTIVITY_CREATED,
    {
      id: String(doc._id),
      userId: String(founderId),
      userName: "",
      type: String(type || "update"),
      message: String(text || ""),
      icon: "📋",
      timestamp: (doc.createdAt || new Date()).toISOString(),
      startupId: sid,
    },
    [startupRoom(sid)],
  );
}

export const createOrUpdateProfile = async (req, res) => {
  const { userId, startupId, bio = "", background = "", links = {} } = req.body || {};

  if (!userId || !startupId) {
    return apiError(res, "userId and startupId are required.", 400);
  }

  const profile = await FounderProfile.findOneAndUpdate(
    { userId },
    { userId, startupId, bio, background, links },
    { upsert: true, new: true, runValidators: true },
  );

  return apiSuccess(res, profile, 201);
};

export const getProfileByUserId = async (req, res) => {
  if (!founderGuard(req, req.params.userId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const profile = await FounderProfile.findOne({ userId: req.params.userId });
  if (!profile) {
    return apiError(res, "Founder profile not found.", 404);
  }

  return apiSuccess(res, profile);
};

export const createOrUpdateStartup = async (req, res) => {
  const { founderId, name, description, industry, stage, website, logo, data } = req.body || {};

  const normalizedFounderId = founderId || req.user.id;

  if (!name) {
    return apiError(res, "name is required.", 400);
  }

  if (!founderGuard(req, normalizedFounderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const startup = await Startup.findOneAndUpdate(
    { founderId: normalizedFounderId },
    {
      founderId: normalizedFounderId,
      name: String(name).trim(),
      description,
      industry,
      stage,
      website,
      logo,
      data,
    },
    { upsert: true, new: true, runValidators: true },
  );

  return apiSuccess(res, startup, 201);
};

export const getStartupByFounderId = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const startup = await Startup.findOne({ founderId: req.params.founderId });
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }
  return apiSuccess(res, startup);
};

export const getStartupById = async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }
  return apiSuccess(res, startup);
};

export const getMilestones = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const milestones = await Milestone.find({ founderId: req.params.founderId }).sort({ sequence: 1 });
  const milestoneIds = milestones.map((m) => String(m._id));
  const tasks = milestoneIds.length
    ? await Task.find({ milestoneId: { $in: milestoneIds } }, { milestoneId: 1, status: 1 })
    : [];
  const countsByMilestone = new Map();
  for (const task of tasks) {
    const key = String(task.milestoneId || "");
    const prev = countsByMilestone.get(key) || { totalTasks: 0, tasksCompleted: 0 };
    prev.totalTasks += 1;
    if (task.status === "completed") prev.tasksCompleted += 1;
    countsByMilestone.set(key, prev);
  }

  const enriched = milestones.map((milestone) => {
    const counters = countsByMilestone.get(String(milestone._id)) || {
      totalTasks: 0,
      tasksCompleted: 0,
    };
    return {
      ...milestone.toObject(),
      totalTasks: counters.totalTasks,
      tasksCompleted: counters.tasksCompleted,
    };
  });
  return apiSuccess(res, enriched);
};

export const createMilestone = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const payload = unwrapPayload(req, "milestone");
  const startup = await Startup.findOne({ founderId });
  const sequence = Number(payload?.sequence || 1);

  const milestone = await Milestone.create({
    founderId,
    startupId: payload?.startupId || startup?._id,
    title: payload?.title || "Milestone",
    description: payload?.description || "",
    dueDate: payload?.dueDate || null,
    sequence,
    status: payload?.status || "pending",
  });

  return apiSuccess(res, milestone, 201);
};

export const deleteMilestone = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  await Milestone.findOneAndDelete({ _id: req.params.milestoneId, founderId });
  return apiSuccess(res, { deleted: true });
};

export const getTasks = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const tasks = await Task.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, tasks);
};

export const createTask = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const payload = unwrapPayload(req, "task");
  const startup = await Startup.findOne({ founderId });

  const taskPayload = {
    founderId,
    startupId: payload?.startupId || startup?._id,
    title: payload?.title || "Untitled task",
    description: payload?.description || "",
    status: payload?.status || "pending",
    assignedTo: payload?.assignedTo || null,
    milestoneId: payload?.milestoneId || null,
    incentive: payload?.incentive || "",
    actionButton: payload?.actionButton || "",
    blockerReason: payload?.blockerReason || "",
    blockerNote: payload?.blockerNote || "",
  };

  const blockedValidation = validateBlockedTaskPayload(taskPayload);
  if (!blockedValidation.ok) {
    return apiError(res, blockedValidation.message, blockedValidation.code);
  }

  const task = await Task.create(taskPayload);
  await syncMilestoneCounters(task.milestoneId);
  await appendLoopActivity({
    founderId,
    startupId: task.startupId,
    type: "status-change",
    text: `Task created: ${task.title}`,
    metadata: { taskId: task._id, status: task.status },
  });

  if (task.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [startupRoom(task.startupId)]);
  }

  return apiSuccess(res, task, 201);
};

export const updateTask = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const payload = unwrapPayload(req, "task");
  const blockedValidation = validateBlockedTaskPayload(payload);
  if (!blockedValidation.ok) {
    return apiError(res, blockedValidation.message, blockedValidation.code);
  }

  const existingTask = await Task.findOne({ _id: req.params.taskId, founderId });
  if (!existingTask) {
    return apiError(res, "Task not found.", 404);
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: req.params.taskId, founderId },
    payload || {},
    { new: true, runValidators: true },
  );
  await syncMilestoneCounters(existingTask.milestoneId);
  await syncMilestoneCounters(updatedTask?.milestoneId);
  if (updatedTask) {
    await appendLoopActivity({
      founderId,
      startupId: updatedTask.startupId,
      type: "status-change",
      text: `Task updated: ${updatedTask.title}`,
      metadata: { taskId: updatedTask._id, status: updatedTask.status },
    });
  }

  if (updatedTask.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, updatedTask, [startupRoom(updatedTask.startupId)]);
  }

  return apiSuccess(res, updatedTask);
};

export const updateTaskStatus = async (req, res) => {
  const founderId = req.params.founderId;
  const payload = req.body || {};
  const status = payload.status;
  const blockerReason = payload.blockerReason || payload.blockedReason || "";
  const blockerNote = payload.blockerNote || payload.blockedNote || "";

  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  if (!status) {
    return apiError(res, "status is required.", 400);
  }

  const updates = { status };
  if (status === "blocked") {
    const blockedValidation = validateBlockedTaskPayload({
      status,
      blockerReason,
      blockerNote,
    });
    if (!blockedValidation.ok) {
      return apiError(res, blockedValidation.message, blockedValidation.code);
    }
    updates.blockerReason = blockedValidation.blockerReason;
    updates.blockerNote = blockedValidation.blockerNote;
  } else {
    updates.blockerReason = "";
    updates.blockerNote = "";
  }
  const existingTask = await Task.findOne({ _id: req.params.taskId, founderId });
  if (!existingTask) {
    return apiError(res, "Task not found.", 404);
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: req.params.taskId, founderId },
    updates,
    { new: true, runValidators: true },
  );

  if (!updatedTask) {
    return apiError(res, "Task not found.", 404);
  }
  await syncMilestoneCounters(existingTask.milestoneId);
  await syncMilestoneCounters(updatedTask.milestoneId);
  await appendLoopActivity({
    founderId,
    startupId: updatedTask.startupId,
    type: status === "completed" ? "task-complete" : "status-change",
    text: `Task status changed to ${status}: ${updatedTask.title}`,
    metadata: { taskId: updatedTask._id, status },
  });

  if (updatedTask.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, updatedTask, [startupRoom(updatedTask.startupId)]);
  }

  return apiSuccess(res, updatedTask);
};

export const assignTask = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const { assignedTo, assigneeId } = req.body || {};
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, founderId },
    { assignedTo: assignedTo || assigneeId || null },
    { new: true, runValidators: true },
  );
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  await appendLoopActivity({
    founderId,
    startupId: task.startupId,
    type: "status-change",
    text: `Task assigned: ${task.title}`,
    metadata: { taskId: task._id, assignedTo: task.assignedTo || null },
  });

  if (task.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [startupRoom(task.startupId)]);
  }

  return apiSuccess(res, task);
};

export const deleteTask = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const deleted = await Task.findOneAndDelete({ _id: req.params.taskId, founderId });
  if (deleted) {
    await syncMilestoneCounters(deleted.milestoneId);
    await appendLoopActivity({
      founderId,
      startupId: deleted.startupId,
      type: "status-change",
      text: `Task deleted: ${deleted.title}`,
      metadata: { taskId: deleted._id },
    });
  }
  return apiSuccess(res, { deleted: true });
};

export const getWeeklyOutcomes = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const outcomes = await WeeklyOutcome.find({ founderId: req.params.founderId }).sort({ weekOf: -1 });
  return apiSuccess(res, outcomes);
};

export const createWeeklyOutcome = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const payload = unwrapPayload(req, "outcome");
  const startup = await Startup.findOne({ founderId });
  const incomingWeek = payload?.weekOf ? new Date(payload.weekOf) : new Date();
  const weekStart = new Date(incomingWeek);
  weekStart.setHours(0, 0, 0, 0);
  const existing = await WeeklyOutcome.findOne({ founderId, weekOf: weekStart });

  const requestedStatus = payload?.status || "active";
  const mutability = ensureOutcomeMutable(existing);
  if (!mutability.ok) {
    return apiError(res, mutability.message, mutability.code, mutability.errors);
  }

  const update = {
    founderId,
    startupId: payload?.startupId || startup?._id,
    weekOf: weekStart,
    goal: payload?.goal || "",
    summary: payload?.summary || payload?.notes || "",
    status: requestedStatus,
    score: Number(payload?.score || 0),
  };

  const outcome = existing
    ? await WeeklyOutcome.findByIdAndUpdate(existing._id, update, {
        new: true,
        runValidators: true,
      })
    : await WeeklyOutcome.create(update);

  await appendLoopActivity({
    founderId,
    startupId: outcome.startupId,
    type: requestedStatus === "active" ? "status-change" : "milestone",
    text:
      requestedStatus === "active"
        ? "Weekly goal set."
        : `Weekly outcome submitted: ${requestedStatus}.`,
    metadata: { outcomeId: outcome._id, status: requestedStatus },
  });

  return apiSuccess(res, outcome, existing ? 200 : 201);
};

export const getPosts = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const posts = await StartupPost.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, posts);
};

export const createPost = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const startup = await Startup.findOne({ founderId });

  const post = await StartupPost.create({
    founderId,
    startupId: req.body?.startupId || startup?._id,
    content: req.body?.content || "",
    visibility: req.body?.visibility || "team",
  });

  return apiSuccess(res, post, 201);
};

export const deletePost = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  await StartupPost.findOneAndDelete({ _id: req.params.postId, founderId: req.params.founderId });
  return apiSuccess(res, { deleted: true });
};

export const getInvitations = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};

export const createInvitation = async (req, res) => {
  const founderId = req.body?.founderId || req.user.id;
  const invitation = await FounderTalentInvitation.create({
    founderId,
    talentId: req.body?.talentId || null,
    startupId: req.body?.startupId || null,
    email: req.body?.email || "",
    message: req.body?.message || "",
    token: crypto.randomUUID(),
    status: "pending",
    kind: "founder-talent",
    metadata: req.body?.metadata || {},
  });

  return apiSuccess(res, invitation, 201);
};

export const getEvents = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const events = await Event.find({ founderId: req.params.founderId }).sort({ startsAt: 1 });
  return apiSuccess(res, events);
};

export const getAnnouncements = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const announcements = await Announcement.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, announcements);
};

export const getFounderResources = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const resources = await Resource.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, { resources });
};

export const getFounderAnalyticsDashboard = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const founderId = req.params.founderId;
  const [outcomes, tasks, totalMembers] = await Promise.all([
    WeeklyOutcome.find({ founderId }).lean(),
    Task.find({ founderId }).lean(),
    TeamMemberProfile.countDocuments({ founderId }),
  ]);

  const completedOutcomes = outcomes.filter((o) => o.status === "completed").length;
  const partialOutcomes = outcomes.filter((o) => o.status === "partial").length;
  const missedOutcomes = outcomes.filter((o) => o.status === "missed").length;
  const totalOutcomes = outcomes.length;
  const achievementRate =
    totalOutcomes === 0 ? 0 : Math.round((completedOutcomes / totalOutcomes) * 100);

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const blockerPatterns =
    blockedTasks.length > 0
      ? [
          {
            reason: blockedTasks[0].blockerReason || "Blocked",
            count: blockedTasks.length,
            averageDuration: 0,
            affectedTasks: blockedTasks.map((t) => t.title).slice(0, 10),
          },
        ]
      : [];

  const teamVelocity = [
    {
      weekLabel: "Latest",
      tasksCompleted: completedTasks,
      completionRate:
        tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100),
      averageCompletionTime: 0,
    },
  ];

  return apiSuccess(res, {
    teamVelocity,
    blockerPatterns,
    outcomeMetrics: {
      totalOutcomes,
      completedOutcomes,
      partialOutcomes,
      missedOutcomes,
      achievementRate,
      currentStreak: 0,
      longestStreak: 0,
    },
    stageInsights: [],
    productivityTrends: [],
    teamPerformance: {
      totalMembers,
      activeMembers: totalMembers,
      topPerformers: [],
    },
  });
};
