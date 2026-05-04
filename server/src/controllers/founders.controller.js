import crypto from "crypto";
import User from "../models/User.js";
import FounderProfile from "../models/FounderProfile.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import { validateWeeklyPlanMilestonesInput } from "../domain/weeklyPlanMilestoneValidation.js";
import StartupPost from "../models/StartupPost.js";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";
import Activity from "../models/Activity.js";
import Resource from "../models/Resource.js";
import StageCompletion from "../models/StageCompletion.js";
import LearningProgress from "../models/LearningProgress.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import {
  computeMilestoneCounters,
  ensureOutcomeMutable,
  validateTaskStatusTransition,
  validateBlockedTaskPayload,
  computeExecutionScoreMetrics,
} from "../domain/weeklyLoopRules.js";
import {
  normalizeJourney,
  validateJourneyPut,
} from "../domain/founderJourney.js";
import { WEEKLY_OUTCOME_STATUSES, TASK_PRIORITIES } from "../utils/enums.js";
import { mapActivityToDto } from "../utils/activityDto.js";
import {
  error as apiError,
  success as apiSuccess,
} from "../utils/apiResponse.js";
import { emitRealtime } from "../services/realtime.service.js";
import { createNotification, broadcastNotification } from "../services/notificationService.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";

// Helper for generic ownership defense
function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

function unwrapPayload(req, key) {
  const body = req.body || {};
  if (
    body &&
    typeof body === "object" &&
    body[key] &&
    typeof body[key] === "object"
  ) {
    return body[key];
  }
  return body;
}

async function syncMilestoneCounters(milestoneId) {
  if (!milestoneId) return;
  const milestoneTasks = await Task.find({ milestoneId }, { status: 1 });
  const counters = computeMilestoneCounters(milestoneTasks);
  await Milestone.findByIdAndUpdate(milestoneId, counters, { new: false });
}

const MAX_COMPLETION_JSON = 32000;

function sanitizeCompletionData(data) {
  if (data === undefined || data === null) return undefined;
  if (typeof data !== "object" || Array.isArray(data)) return undefined;
  try {
    const s = JSON.stringify(data);
    if (s.length > MAX_COMPLETION_JSON) return undefined;
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

async function appendLoopActivity({
  founderId,
  startupId,
  type,
  text,
  metadata = {},
}) {
  if (!startupId) return;
  const doc = await Activity.create({
    startupId,
    userId: founderId,
    type,
    text,
    metadata: { ...metadata, userName: metadata?.userName || "" },
  });
  const sid = String(startupId);
  emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, mapActivityToDto(doc), [
    startupRoom(sid),
  ]);
}

export const createOrUpdateProfile = async (req, res) => {
  const {
    userId,
    startupId,
    bio = "",
    background = "",
    links = {},
  } = req.body || {};

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
  const { founderId, name, description, industry, stage, website, logo, data } =
    req.body || {};

  const normalizedFounderId = founderId || req.user.id;

  if (!name) {
    return apiError(res, "name is required.", 400);
  }

  if (!founderGuard(req, normalizedFounderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const existing = await Startup.findOne({ founderId: normalizedFounderId });
  const mergedData =
    data !== undefined && data !== null && typeof data === "object"
      ? { ...((existing && existing.data) || {}), ...data }
      : existing?.data;

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
      ...(mergedData !== undefined ? { data: mergedData } : {}),
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
  const founderId = req.params.founderId;
  const weeklyOutcomeId = req.query?.weeklyOutcomeId;
  const filter = { founderId };
  if (weeklyOutcomeId) {
    filter.weeklyOutcomeId = weeklyOutcomeId;
  }
  const milestones = await Milestone.find(filter).sort({ sequence: 1 });
  const milestoneIds = milestones.map((m) => String(m._id));
  const tasks = milestoneIds.length
    ? await Task.find(
        { milestoneId: { $in: milestoneIds } },
        { milestoneId: 1, status: 1 },
      )
    : [];
  const countsByMilestone = new Map();
  for (const task of tasks) {
    const key = String(task.milestoneId || "");
    const prev = countsByMilestone.get(key) || {
      totalTasks: 0,
      tasksCompleted: 0,
    };
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
  const weeklyOutcomeId = payload?.weeklyOutcomeId || null;
  if (weeklyOutcomeId) {
    const outcome = await WeeklyOutcome.findOne({
      _id: weeklyOutcomeId,
      founderId,
    });
    if (!outcome) {
      return apiError(res, "Weekly outcome not found.", 404);
    }
    const mutability = ensureOutcomeMutable(outcome);
    if (!mutability.ok) {
      return apiError(
        res,
        mutability.message,
        mutability.code,
        mutability.errors,
      );
    }
  }

  const startup = await Startup.findOne({ founderId });
  const sequence = Number(payload?.sequence || 1);

  const milestone = await Milestone.create({
    founderId,
    startupId: payload?.startupId || startup?._id,
    title: payload?.title || "Milestone",
    description: payload?.description || "",
    dueDate: payload?.dueDate || null,
    weeklyOutcomeId,
    sequence,
    status: payload?.status || "pending",
  });

  return apiSuccess(res, milestone, 201);
};

export const updateMilestone = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const existing = await Milestone.findOne({
    _id: req.params.milestoneId,
    founderId,
  });
  if (!existing) {
    return apiError(res, "Milestone not found.", 404);
  }

  if (existing.weeklyOutcomeId) {
    const outcome = await WeeklyOutcome.findOne({
      _id: existing.weeklyOutcomeId,
      founderId,
    });
    if (outcome) {
      const mutability = ensureOutcomeMutable(outcome);
      if (!mutability.ok) {
        return apiError(
          res,
          mutability.message,
          mutability.code,
          mutability.errors,
        );
      }
    }
  }

  const payload = unwrapPayload(req, "milestone") || {};
  const updates = {};

  if (payload.title != null) {
    const t = String(payload.title).trim();
    if (t.length < 2) {
      return apiError(
        res,
        "Milestone title must be at least 2 characters.",
        400,
      );
    }
    updates.title = t.slice(0, 200);
  }
  if (payload.description != null) {
    updates.description = String(payload.description).trim().slice(0, 5000);
  }
  if (payload.sequence != null) {
    const s = Number(payload.sequence);
    if (Number.isFinite(s) && s >= 1) {
      updates.sequence = Math.round(s);
    }
  }
  if (payload.dueDate !== undefined) {
    updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }

  if (!Object.keys(updates).length) {
    return apiSuccess(res, existing);
  }

  const milestone = await Milestone.findOneAndUpdate(
    { _id: existing._id, founderId },
    updates,
    { new: true, runValidators: true },
  );

  return apiSuccess(res, milestone);
};

export const deleteMilestone = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const existing = await Milestone.findOne({
    _id: req.params.milestoneId,
    founderId,
  });
  if (!existing) {
    return apiError(res, "Milestone not found.", 404);
  }

  if (existing.weeklyOutcomeId) {
    const outcome = await WeeklyOutcome.findOne({
      _id: existing.weeklyOutcomeId,
      founderId,
    });
    if (outcome) {
      const mutability = ensureOutcomeMutable(outcome);
      if (!mutability.ok) {
        return apiError(
          res,
          mutability.message,
          mutability.code,
          mutability.errors,
        );
      }
    }
  }

  await Task.deleteMany({ milestoneId: existing._id, founderId });
  await Milestone.deleteOne({ _id: existing._id, founderId });
  return apiSuccess(res, { deleted: true });
};

export const getTasks = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const tasks = await Task.find({ founderId: req.params.founderId }).sort({
    createdAt: -1,
  });
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
    assignedToName: String(payload?.assignedToName || "")
      .trim()
      .slice(0, 200),
    assignedToAvatar: String(payload?.assignedToAvatar || "")
      .trim()
      .slice(0, 2000),
    milestoneId: payload?.milestoneId || null,
    priority: TASK_PRIORITIES.includes(
      String(payload?.priority || "").toLowerCase(),
    )
      ? String(payload.priority).toLowerCase()
      : "medium",
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
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [
      startupRoom(task.startupId),
    ]);
  }

  // Notify assignee when a task is created already assigned to them.
  if (task.assignedTo && String(task.assignedTo) !== String(founderId)) {
    await createNotification({
      userId: task.assignedTo,
      type: "task-assigned",
      title: "New task assigned",
      message: `You have a new task: ${task.title}`,
      actionUrl: `/?view=virtual-office&tab=tasks&taskId=${task._id}`,
      metadata: {
        taskId: String(task._id),
        startupId: String(task.startupId || ""),
        founderId: String(founderId),
      },
    });
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

  const existingTask = await Task.findOne({
    _id: req.params.taskId,
    founderId,
  });
  if (!existingTask) {
    return apiError(res, "Task not found.", 404);
  }
  if (payload?.status) {
    const transition = validateTaskStatusTransition(
      existingTask.status,
      payload.status,
    );
    if (!transition.ok) {
      return apiError(res, transition.message, transition.code);
    }
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
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, updatedTask, [
      startupRoom(updatedTask.startupId),
    ]);
  }

  // Notify on assignment change to a new assignee.
  const prevAssignee = String(existingTask.assignedTo || "");
  const nextAssignee = String(updatedTask?.assignedTo || "");
  if (
    nextAssignee &&
    nextAssignee !== prevAssignee &&
    nextAssignee !== String(founderId)
  ) {
    await createNotification({
      userId: nextAssignee,
      type: "task-assigned",
      title: "Task reassigned to you",
      message: `You have been assigned: ${updatedTask.title}`,
      actionUrl: `/?view=virtual-office&tab=tasks&taskId=${updatedTask._id}`,
      metadata: {
        taskId: String(updatedTask._id),
        startupId: String(updatedTask.startupId || ""),
        founderId: String(founderId),
      },
    });
  }

  // Notify founder when a task transitions into blocked state.
  if (
    updatedTask &&
    updatedTask.status === "blocked" &&
    existingTask.status !== "blocked"
  ) {
    await createNotification({
      userId: founderId,
      type: "task-blocked",
      title: "Task blocked",
      message: `Task is blocked: ${updatedTask.title}`,
      actionUrl: `/?view=virtual-office&tab=tasks&taskId=${updatedTask._id}`,
      metadata: {
        taskId: String(updatedTask._id),
        blockerReason: updatedTask.blockerReason || "",
        blockerNote: updatedTask.blockerNote || "",
      },
    });
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
  const transition = validateTaskStatusTransition(existingTask.status, status);
  if (!transition.ok) {
    return apiError(res, transition.message, transition.code);
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
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, updatedTask, [
      startupRoom(updatedTask.startupId),
    ]);
  }

  if (status === "blocked" && existingTask.status !== "blocked") {
    await createNotification({
      userId: founderId,
      type: "task-blocked",
      title: "Task blocked",
      message: `Task is blocked: ${updatedTask.title}`,
      actionUrl: `/?view=virtual-office&tab=tasks&taskId=${updatedTask._id}`,
      metadata: {
        taskId: String(updatedTask._id),
        blockerReason: updatedTask.blockerReason || "",
        blockerNote: updatedTask.blockerNote || "",
      },
    });
  }

  return apiSuccess(res, updatedTask);
};

export const assignTask = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const body = req.body || {};
  const {
    assignedTo,
    assigneeId,
    assigneeName,
    assignedToName,
    assignedToAvatar,
  } = body;
  const nextAssigned = assignedTo || assigneeId || null;
  const name =
    String(assigneeName || assignedToName || "")
      .trim()
      .slice(0, 200) || "";
  const avatar =
    String(assignedToAvatar || "")
      .trim()
      .slice(0, 2000) || "";
  const assignUpdate = {
    assignedTo: nextAssigned,
    assignedToName: nextAssigned ? name : "",
    assignedToAvatar: nextAssigned ? avatar : "",
  };
  const previous = await Task.findOne(
    { _id: req.params.taskId, founderId },
    { assignedTo: 1 },
  );
  const previousAssignee = String(previous?.assignedTo || "");
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, founderId },
    assignUpdate,
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
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [
      startupRoom(task.startupId),
    ]);
  }

  const nextAssigneeId = String(task.assignedTo || "");
  if (
    nextAssigneeId &&
    nextAssigneeId !== previousAssignee &&
    nextAssigneeId !== String(founderId)
  ) {
    await createNotification({
      userId: task.assignedTo,
      type: "task-assigned",
      title: "Task assigned to you",
      message: `You have been assigned: ${task.title}`,
      actionUrl: `/?view=virtual-office&tab=tasks&taskId=${task._id}`,
      metadata: {
        taskId: String(task._id),
        startupId: String(task.startupId || ""),
        founderId: String(founderId),
      },
    });
  }

  return apiSuccess(res, task);
};

export const deleteTask = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const deleted = await Task.findOneAndDelete({
    _id: req.params.taskId,
    founderId,
  });
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
  const outcomes = await WeeklyOutcome.find({
    founderId: req.params.founderId,
  }).sort({ weekOf: -1 });
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
  const existing = await WeeklyOutcome.findOne({
    founderId,
    weekOf: weekStart,
  });

  const requestedLower = String(payload?.status || "active").toLowerCase();
  const requestedStatus =
    WEEKLY_OUTCOME_STATUSES.find(
      (s) => String(s).toLowerCase() === requestedLower,
    ) || null;
  if (!requestedStatus) {
    return apiError(
      res,
      `Invalid status. Allowed: ${WEEKLY_OUTCOME_STATUSES.join(", ")}.`,
      400,
    );
  }

  const mutability = ensureOutcomeMutable(existing);
  if (!mutability.ok) {
    return apiError(
      res,
      mutability.message,
      mutability.code,
      mutability.errors,
    );
  }

  const goalText = String(payload?.goal || payload?.title || "").trim();
  if (!goalText) {
    return apiError(res, "goal (or title) is required.", 400);
  }

  if (!startup?._id) {
    return apiError(
      res,
      "Startup is required before saving weekly outcomes.",
      400,
    );
  }

  const update = {
    founderId,
    startupId: payload?.startupId || startup._id,
    weekOf: weekStart,
    goal: goalText,
    summary: String(
      payload?.summary || payload?.notes || payload?.description || "",
    ).trim(),
    status: requestedStatus,
    score: Number(payload?.score || 0),
  };

  const completionData = sanitizeCompletionData(payload?.completionData);
  if (completionData !== undefined) {
    update.completionData = completionData;
  }
  if (payload?.completionPercentage != null) {
    const p = Number(payload.completionPercentage);
    if (Number.isFinite(p)) {
      update.completionPercentage = Math.min(100, Math.max(0, p));
    }
  }
  if (payload?.completedAt) {
    const d = new Date(payload.completedAt);
    if (!Number.isNaN(d.getTime())) {
      update.completedAt = d;
    }
  }
  if (payload?.weekNumber != null) {
    const w = Number(payload.weekNumber);
    if (Number.isFinite(w) && w >= 1) {
      update.weekNumber = Math.round(w);
    }
  }

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

  // Notify team members when an outcome is submitted (final status).
  if (
    requestedStatus !== "active" &&
    outcome.startupId &&
    (!existing || existing.status === "active")
  ) {
    try {
      const teamMembers = await TeamMemberProfile.find(
        { founderId },
        { userId: 1 },
      ).lean();
      const recipients = teamMembers.map((m) => m.userId).filter(Boolean);
      if (recipients.length) {
        await broadcastNotification(recipients, {
          type: "outcome-submitted",
          title: "Weekly outcome submitted",
          message: `This week's outcome was marked ${requestedStatus}.`,
          actionUrl: `/?view=virtual-office&tab=weekly`,
          metadata: {
            outcomeId: String(outcome._id),
            status: requestedStatus,
            startupId: String(outcome.startupId),
            founderId: String(founderId),
          },
        });
      }
    } catch (err) {
      // Notification fan-out must not block the persistence response.
      console.error("[createWeeklyOutcome] notify team failed:", err.message);
    }
  }

  return apiSuccess(res, outcome, existing ? 200 : 201);
};

function serializeTaskActionButton(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") return String(value).slice(0, 1000);
  try {
    return JSON.stringify(value).slice(0, 1000);
  } catch {
    return "";
  }
}

function parseIntentCategory(input) {
  const text = String(input || "").toLowerCase();
  const defs = [
    {
      category: "validation",
      keywords: [
        "validate",
        "interview",
        "survey",
        "feedback",
        "assumption",
        "test",
      ],
      title: "Validate core assumptions with real users",
      description: "Test and validate key assumptions with target users.",
      milestones: [
        {
          title: "Define validation criteria",
          tasks: [
            "List assumptions",
            "Define success metrics",
            "Create interview/survey guide",
          ],
        },
        {
          title: "Recruit participants",
          tasks: [
            "Define participant profile",
            "Reach out to candidates",
            "Schedule sessions",
          ],
        },
        {
          title: "Conduct validation",
          tasks: ["Run sessions", "Document findings", "Synthesize insights"],
        },
      ],
    },
    {
      category: "product-development",
      keywords: ["build", "mvp", "feature", "prototype", "develop", "ship"],
      title: "Build and ship core product scope",
      description: "Deliver the highest-impact product work for this week.",
      milestones: [
        {
          title: "Finalize scope",
          tasks: [
            "Prioritize must-have items",
            "Define acceptance criteria",
            "Plan implementation",
          ],
        },
        {
          title: "Implement core work",
          tasks: ["Build features", "Test critical paths", "Fix blockers"],
        },
        {
          title: "Ship and review",
          tasks: [
            "Deploy/update release",
            "Collect early feedback",
            "Capture learnings",
          ],
        },
      ],
    },
    {
      category: "team-building",
      keywords: [
        "team",
        "hire",
        "cofounder",
        "co-founder",
        "talent",
        "recruit",
      ],
      title: "Find and onboard the right team members",
      description: "Identify, engage, and move forward with critical talent.",
      milestones: [
        {
          title: "Define roles",
          tasks: [
            "List required roles",
            "Clarify responsibilities",
            "Set selection criteria",
          ],
        },
        {
          title: "Source candidates",
          tasks: [
            "Shortlist candidates",
            "Reach out and screen",
            "Schedule conversations",
          ],
        },
        {
          title: "Close and onboard",
          tasks: [
            "Select top candidates",
            "Align on terms",
            "Start onboarding",
          ],
        },
      ],
    },
  ];

  let best = null;
  let score = 0;
  const detectedKeywords = [];
  for (const def of defs) {
    let cur = 0;
    for (const k of def.keywords) {
      if (text.includes(k)) {
        cur += 1;
        detectedKeywords.push(k);
      }
    }
    if (cur > score) {
      score = cur;
      best = def;
    }
  }
  if (!best) {
    return {
      category: "general",
      confidence: 0.5,
      suggestedTitle:
        String(input || "").slice(0, 70) || "Set a focused weekly outcome",
      suggestedDescription:
        "Define a concrete, measurable outcome for this week.",
      detectedKeywords: [],
      suggestedMilestones: [
        {
          title: "Plan",
          tasks: [
            "Define success criteria",
            "Break work into tasks",
            "Assign ownership",
          ],
        },
        {
          title: "Execute",
          tasks: [
            "Complete core tasks",
            "Track progress daily",
            "Resolve blockers quickly",
          ],
        },
        {
          title: "Review",
          tasks: ["Measure results", "Document learnings", "Plan next steps"],
        },
      ],
    };
  }
  return {
    category: best.category,
    confidence: Math.min(0.95, 0.6 + score * 0.1),
    suggestedTitle: best.title,
    suggestedDescription: best.description,
    detectedKeywords: [...new Set(detectedKeywords)],
    suggestedMilestones: best.milestones,
  };
}

export const createWeeklyPlan = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const plan = unwrapPayload(req, "plan") || req.body?.plan || req.body || {};
  const goalText = String(plan.goal || plan.title || "").trim();
  if (!goalText) {
    return apiError(res, "goal is required.", 400);
  }

  const startup = await Startup.findOne({ founderId });
  if (!startup?._id) {
    return apiError(
      res,
      "Startup is required before setting a weekly plan.",
      400,
    );
  }

  const incomingWeek = plan.weekOf ? new Date(plan.weekOf) : new Date();
  const weekStart = new Date(incomingWeek);
  weekStart.setHours(0, 0, 0, 0);

  const existing = await WeeklyOutcome.findOne({
    founderId,
    weekOf: weekStart,
  });
  const mutability = ensureOutcomeMutable(existing);
  if (!mutability.ok) {
    return apiError(
      res,
      mutability.message,
      mutability.code,
      mutability.errors,
    );
  }

  const milestonesInput = Array.isArray(plan.milestones) ? plan.milestones : [];
  const milestoneValidation = validateWeeklyPlanMilestonesInput(milestonesInput);
  if (!milestoneValidation.ok) {
    return apiError(res, milestoneValidation.message, 400);
  }
  const createdMilestones = [];

  const planStatusLower = String(plan.status || "active").toLowerCase();
  const planStatusCanonical =
    WEEKLY_OUTCOME_STATUSES.find(
      (s) => String(s).toLowerCase() === planStatusLower,
    ) || "active";

  const update = {
    founderId,
    startupId: startup._id,
    weekOf: weekStart,
    goal: goalText,
    summary: String(plan.summary || plan.description || "").trim(),
    status: planStatusCanonical,
    score: Number(plan.score || 0),
  };

  const completionDataPlan = sanitizeCompletionData(plan?.completionData);
  if (completionDataPlan !== undefined) {
    update.completionData = completionDataPlan;
  }
  if (plan?.completionPercentage != null) {
    const p = Number(plan.completionPercentage);
    if (Number.isFinite(p)) {
      update.completionPercentage = Math.min(100, Math.max(0, p));
    }
  }
  if (plan?.completedAt) {
    const d = new Date(plan.completedAt);
    if (!Number.isNaN(d.getTime())) {
      update.completedAt = d;
    }
  }
  if (plan?.weekNumber != null) {
    const w = Number(plan.weekNumber);
    if (Number.isFinite(w) && w >= 1) {
      update.weekNumber = Math.round(w);
    }
  }

  let outcome;
  const oldMilestoneIds = existing?._id
    ? (
        await Milestone.find(
          { weeklyOutcomeId: existing._id },
          { _id: 1 },
        ).lean()
      ).map((d) => d._id)
    : [];

  try {
    if (existing) {
      outcome = await WeeklyOutcome.findByIdAndUpdate(existing._id, update, {
        new: true,
        runValidators: true,
      });
    } else {
      outcome = await WeeklyOutcome.create(update);
    }

    let sequence = 1;
    for (const m of milestonesInput) {
      const milestone = await Milestone.create({
        founderId,
        startupId: startup._id,
        weeklyOutcomeId: outcome._id,
        title: String(m?.title || "Milestone")
          .trim()
          .slice(0, 200),
        description: String(m?.description || "").slice(0, 5000),
        dueDate: m?.dueDate ? new Date(m.dueDate) : null,
        sequence: sequence++,
        status: "pending",
      });
      createdMilestones.push(milestone);

      const taskItems = Array.isArray(m?.tasks) ? m.tasks : [];
      for (const t of taskItems) {
        const title = typeof t === "string" ? t : t?.title;
        if (!title || !String(title).trim()) continue;
        const actionButton =
          typeof t === "object" && t !== null
            ? serializeTaskActionButton(t.actionButton)
            : "";
        await Task.create({
          founderId,
          startupId: startup._id,
          title: String(title).trim().slice(0, 200),
          description:
            typeof t === "object" && t?.description
              ? String(t.description).slice(0, 5000)
              : "",
          status: "pending",
          milestoneId: milestone._id,
          actionButton,
        });
      }
    }

    for (const m of createdMilestones) {
      await syncMilestoneCounters(m._id);
    }

    if (oldMilestoneIds.length) {
      await Task.deleteMany({ milestoneId: { $in: oldMilestoneIds } });
      await Milestone.deleteMany({ _id: { $in: oldMilestoneIds } });
    }
  } catch (error) {
    const createdIds = createdMilestones.map((m) => m._id);
    if (createdIds.length) {
      await Task.deleteMany({ milestoneId: { $in: createdIds } });
      await Milestone.deleteMany({ _id: { $in: createdIds } });
    }
    if (!existing && outcome?._id) {
      await WeeklyOutcome.deleteOne({ _id: outcome._id, founderId });
    }
    throw error;
  }

  await appendLoopActivity({
    founderId,
    startupId: outcome.startupId,
    type: "status-change",
    text: "Weekly goal set.",
    metadata: {
      outcomeId: outcome._id,
      milestoneCount: createdMilestones.length,
    },
  });

  return apiSuccess(
    res,
    {
      outcome,
      milestones: createdMilestones,
    },
    existing ? 200 : 201,
  );
};

export const parseFounderIntent = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const input = String(req.body?.input || "").trim();
  if (!input) {
    return apiError(res, "input is required.", 400);
  }
  const parsed = parseIntentCategory(input);
  return apiSuccess(res, {
    ...parsed,
    originalInput: input,
  });
};

export const getFounderJourney = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const startup = await Startup.findOne({ founderId });
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }
  const data = startup.data || {};
  return apiSuccess(res, {
    journey: normalizeJourney(data.journey),
    homeUi: data.homeUi && typeof data.homeUi === "object" ? data.homeUi : {},
  });
};

export const putFounderJourney = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const parsed = validateJourneyPut(req.body || {});
  if (!parsed.ok) {
    return apiError(res, parsed.errors.join(" "), 400);
  }
  if (!parsed.hasJourney && !parsed.hasHomeUi) {
    return apiError(res, "Provide journey and/or homeUi.", 400);
  }
  const startup = await Startup.findOne({ founderId });
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }
  const mergedData = { ...(startup.data || {}) };
  if (parsed.hasJourney) {
    mergedData.journey = parsed.journey;
  }
  if (parsed.hasHomeUi && parsed.homeUi) {
    mergedData.homeUi = { ...(mergedData.homeUi || {}), ...parsed.homeUi };
  }
  await Startup.findByIdAndUpdate(startup._id, { data: mergedData });
  return apiSuccess(res, {
    journey: normalizeJourney(mergedData.journey),
    homeUi:
      mergedData.homeUi && typeof mergedData.homeUi === "object"
        ? mergedData.homeUi
        : {},
  });
};

export const getFounderExecutionState = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const startup = await Startup.findOne({ founderId });
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }

  const outcomes = await WeeklyOutcome.find({ founderId })
    .sort({ weekOf: -1 })
    .limit(24);

  const activeOutcome =
    outcomes.find((o) => String(o.status || "").toLowerCase() === "active") ||
    null;
  const activeId = activeOutcome?._id;
  const outcomeIds = outcomes.map((o) => o._id);

  const milestoneFilter = { founderId };
  if (activeId) {
    milestoneFilter.weeklyOutcomeId = activeId;
  } else if (outcomeIds.length) {
    milestoneFilter.weeklyOutcomeId = { $in: outcomeIds };
  }

  const milestones = await Milestone.find(milestoneFilter).sort({
    sequence: 1,
  });
  const milestoneIds = milestones.map((m) => m._id);
  const tasks = milestoneIds.length
    ? await Task.find({ founderId, milestoneId: { $in: milestoneIds } })
    : [];

  const metrics = computeExecutionScoreMetrics(tasks, outcomes);

  return apiSuccess(res, {
    journey: normalizeJourney(startup.data?.journey),
    homeUi:
      startup.data?.homeUi && typeof startup.data.homeUi === "object"
        ? startup.data.homeUi
        : {},
    outcomes,
    milestones,
    tasks,
    executionScore: { userId: founderId, ...metrics },
  });
};

export const getPosts = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const posts = await StartupPost.find({
    founderId: req.params.founderId,
  }).sort({ createdAt: -1 });
  return apiSuccess(res, posts);
};

export const createPost = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const p = req.body?.post || req.body || {};
  const startup = await Startup.findOne({ founderId });
  const resolvedStartupId = p.startupId || req.body?.startupId || startup?._id || null;

  const buildOffer = (src) => {
    if (!src || typeof src !== "object") return undefined;
    return {
      compensationPhilosophy: src.compensationPhilosophy || "",
      equityMin: src.equityMin != null ? String(src.equityMin) : "",
      equityMax: src.equityMax != null ? String(src.equityMax) : "",
      salaryMin: src.salaryMin != null ? String(src.salaryMin) : "",
      salaryMax: src.salaryMax != null ? String(src.salaryMax) : "",
      currency: src.currency || "",
      notes: src.notes || "",
    };
  };

  const fields = {
    founderId,
    startupId: resolvedStartupId,
    title: String(p.title || "").slice(0, 200),
    description: String(p.description || "").slice(0, 5000),
    founderName: String(p.founder || p.founderName || "").slice(0, 200),
    industry: String(p.industry || "").slice(0, 100),
    stage: String(p.stage || "").slice(0, 100),
    funding: String(p.funding || "").slice(0, 100),
    location: String(p.location || "").slice(0, 200),
    commitment: String(p.commitment || "").slice(0, 100),
    teamSize: Math.max(0, Number(p.teamSize) || 0),
    lookingFor: Array.isArray(p.lookingFor) ? p.lookingFor.map(String) : [],
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
    offer: buildOffer(p.offer),
    interested: Math.max(0, Number(p.interested) || 0),
    postedDate: p.postedDate ? new Date(p.postedDate) : new Date(),
    website: String(p.website || "").slice(0, 1000),
    linkedinUrl: String(p.linkedinUrl || "").slice(0, 1000),
    githubUrl: String(p.githubUrl || "").slice(0, 1000),
    contactEmail: String(p.contactEmail || "").slice(0, 200),
    pitchDeckUrl: String(p.pitchDeckUrl || "").slice(0, 1000),
    content: p.content || JSON.stringify(p),
    visibility: p.visibility || req.body?.visibility || "public",
  };

  const post = await StartupPost.findOneAndUpdate({ founderId }, fields, {
    upsert: true,
    new: true,
    runValidators: true,
  });

  return apiSuccess(res, post, 201);
};

export const deletePost = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  await StartupPost.findOneAndDelete({
    _id: req.params.postId,
    founderId: req.params.founderId,
  });
  return apiSuccess(res, { deleted: true });
};

export const getInvitations = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({
    founderId: req.params.founderId,
  }).sort({ createdAt: -1 });
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
  const events = await Event.find({ founderId: req.params.founderId }).sort({
    startsAt: 1,
  });
  return apiSuccess(res, events);
};

export const getAnnouncements = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const announcements = await Announcement.find({
    founderId: req.params.founderId,
  }).sort({ createdAt: -1 });
  return apiSuccess(res, announcements);
};

export const getFounderResources = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const resources = await Resource.find({
    founderId: req.params.founderId,
  }).sort({ createdAt: -1 });
  return apiSuccess(res, { resources });
};

// ─── Stage Tasks ────────────────────────────────────────────────────────────

export const getStageTaskResponses = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const startup = await Startup.findOne({ founderId });
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }
  const stageTaskResponses =
    startup.data?.stageTaskResponses &&
    typeof startup.data.stageTaskResponses === "object"
      ? startup.data.stageTaskResponses
      : {};
  return apiSuccess(res, { stageTaskResponses });
};

export const putStageTaskResponses = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const body = req.body || {};
  const stageId = String(body.stageId ?? "");
  const taskId = String(body.taskId ?? "");
  const text =
    typeof body.text === "string" ? body.text.trim().slice(0, 10000) : "";
  const completedAt = body.completedAt ? new Date(body.completedAt) : null;

  if (!stageId || !taskId) {
    return apiError(res, "stageId and taskId are required.", 400);
  }

  const startup = await Startup.findOne({ founderId });
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }

  const mergedData = { ...(startup.data || {}) };
  const existing = mergedData.stageTaskResponses || {};
  const stageResponses =
    existing[stageId] && typeof existing[stageId] === "object"
      ? { ...existing[stageId] }
      : {};

  stageResponses[taskId] = {
    ...(stageResponses[taskId] || {}),
    text,
    updatedAt: new Date().toISOString(),
    ...(completedAt ? { completedAt: completedAt.toISOString() } : {}),
  };

  mergedData.stageTaskResponses = { ...existing, [stageId]: stageResponses };
  await Startup.findByIdAndUpdate(startup._id, { data: mergedData });
  return apiSuccess(res, { stageTaskResponses: mergedData.stageTaskResponses });
};

// ─── Stage Completions ──────────────────────────────────────────────────────

export const getStageCompletions = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const completions = await StageCompletion.find({ founderId })
    .sort({ completedAt: -1 })
    .lean();
  return apiSuccess(res, { stageCompletions: completions });
};

export const createStageCompletion = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const body = req.body || {};
  const stageId = Number(body.stageId);
  if (!stageId || stageId < 1 || stageId > 6) {
    return apiError(res, "Valid stageId (1–6) is required.", 400);
  }

  const startup = await Startup.findOne({ founderId });

  const completion = await StageCompletion.create({
    founderId,
    startupId: startup?._id ?? null,
    stageId,
    stageName: String(body.stageName || "")
      .trim()
      .slice(0, 100),
    method: ["completed", "skipped"].includes(body.method)
      ? body.method
      : "completed",
    tasksCompletedCount: Number(body.tasksCompletedCount ?? 0),
    tasksTotal: Number(body.tasksTotal ?? 0),
    durationDays: Number(body.durationDays ?? 0),
    completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
    metadata:
      typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata
        : {},
  });

  if (startup?._id) {
    appendLoopActivity({
      founderId,
      startupId: startup._id,
      type: "stage_completed",
      text: `Stage ${stageId} (${completion.stageName || "Stage " + stageId}) ${completion.method === "skipped" ? "skipped" : "completed"}.`,
      metadata: { stageId, method: completion.method },
    }).catch(() => {});
  }

  return apiSuccess(res, { stageCompletion: completion }, 201);
};

// ─── Learning Resources (Videos) ───────────────────────────────────────────

export const getLearningResources = async (req, res) => {
  if (!founderGuard(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const query = { type: "video" };
  if (req.query.stageId != null && req.query.stageId !== "") {
    query.stageId = Number(req.query.stageId);
  }
  const resources = await Resource.find(query)
    .sort({ stageId: 1, recommended: -1, createdAt: 1 })
    .lean();
  return apiSuccess(res, { resources });
};

export const getLearningProgress = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const progress = await LearningProgress.find({ founderId })
    .sort({ watchedAt: -1 })
    .lean();
  return apiSuccess(res, { progress });
};

export const trackLearningWatch = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const body = req.body || {};
  const resourceId = body.resourceId;
  if (!resourceId) {
    return apiError(res, "resourceId is required.", 400);
  }

  const resource = await Resource.findById(resourceId).lean();
  if (!resource) {
    return apiError(res, "Resource not found.", 404);
  }

  const record = await LearningProgress.findOneAndUpdate(
    { founderId, resourceId },
    {
      founderId,
      resourceId,
      stageId: resource.stageId ?? null,
      watchedAt: new Date(),
      watchDurationSeconds: Number(body.watchDurationSeconds ?? 0),
      completed: Boolean(body.completed),
    },
    { upsert: true, new: true, runValidators: true },
  );

  return apiSuccess(res, { progress: record }, 201);
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

  const completedOutcomes = outcomes.filter(
    (o) => o.status === "completed",
  ).length;
  const partialOutcomes = outcomes.filter((o) => o.status === "partial").length;
  const missedOutcomes = outcomes.filter((o) => o.status === "missed").length;
  const totalOutcomes = outcomes.length;
  const achievementRate =
    totalOutcomes === 0
      ? 0
      : Math.round((completedOutcomes / totalOutcomes) * 100);

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
        tasks.length === 0
          ? 0
          : Math.round((completedTasks / tasks.length) * 100),
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

// Public-safe DTO for founder list
function publicFounderDto(user, startup) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    onboardingComplete: !!user.onboardingComplete,
    startup: startup
      ? {
          id: String(startup._id),
          name: startup.name,
          description: startup.description || "",
          industry: startup.industry || "",
          stage: startup.stage || "",
          logo: startup.logo || "",
          website: startup.website || "",
        }
      : null,
  };
}

// Blueprint §14: GET /api/v1/founders/
export const listFounders = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 50, 1), 100);
  const skip = Math.max(parseInt(req.query?.skip, 10) || 0, 0);
  const founders = await User.find({ role: "founder" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const founderIds = founders.map((f) => f._id);
  const startups = await Startup.find({ founderId: { $in: founderIds } }).lean();
  const startupByFounder = new Map(
    startups.map((s) => [String(s.founderId), s]),
  );
  const items = founders
    .map((u) => publicFounderDto(u, startupByFounder.get(String(u._id))))
    .filter(Boolean);
  return apiSuccess(res, { founders: items, limit, skip, count: items.length });
};

// Blueprint §14: GET /api/v1/founders/:founderId/execution-data
// Aggregate of milestones + tasks + outcomes used by client surfaces
export const getExecutionData = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const [milestones, tasks, outcomes] = await Promise.all([
    Milestone.find({ founderId }).sort({ sequence: 1 }).lean(),
    Task.find({ founderId }).sort({ createdAt: -1 }).lean(),
    WeeklyOutcome.find({ founderId }).sort({ weekOf: -1 }).lean(),
  ]);
  const metrics = computeExecutionScoreMetrics({ tasks, outcomes });
  return apiSuccess(res, {
    milestones,
    tasks,
    outcomes,
    metrics,
  });
};

// Blueprint §14: GET /api/v1/startups/:founderId/snapshot
export const getStartupSnapshot = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const startup = await Startup.findOne({ founderId }).lean();
  if (!startup) {
    return apiError(res, "Startup not found.", 404);
  }
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const [activeOutcome, recentActivities, tasks, outcomes] = await Promise.all([
    WeeklyOutcome.findOne({ founderId, status: "active" })
      .sort({ weekOf: -1 })
      .lean(),
    Activity.find({ startupId: startup._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Task.find({ founderId }, { status: 1, milestoneId: 1 }).lean(),
    WeeklyOutcome.find({ founderId }, { status: 1, weekOf: 1 }).lean(),
  ]);
  const metrics = computeExecutionScoreMetrics({ tasks, outcomes });
  return apiSuccess(res, {
    startup,
    activeWeeklyOutcome: activeOutcome || null,
    recentActivities: recentActivities.map(mapActivityToDto),
    executionScore: metrics,
  });
};
