import TeamMemberProfile from "../models/TeamMemberProfile.js";
import TeamMemberStatus from "../models/TeamMemberStatus.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

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
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, assignedTo: req.params.teamMemberId },
    req.body || {},
    { new: true, runValidators: true },
  );
  if (!task) {
    return apiError(res, "Task not found.", 404);
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
