import mongoose from "mongoose";
import Project from "../models/Project.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_MEMBER_ROLES,
} from "../utils/enums.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { syncProjectCounters } from "../utils/syncProjectCounters.js";
import { syncProjectIssues } from "../services/githubSyncService.js";

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

function slugFromName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlugForStartup(startupId, baseSlug, excludeProjectId = null) {
  let slug = baseSlug || "project";
  let n = 2;
  const exclude = excludeProjectId ? { _id: { $ne: excludeProjectId } } : {};
  while (await Project.findOne({ startupId, slug, ...exclude })) {
    slug = `${baseSlug}-${n++}`;
  }
  return slug;
}

async function resolveStartupId(founderId, bodyStartupId) {
  if (bodyStartupId) return bodyStartupId;
  const startup = await Startup.findOne({ founderId });
  return startup?._id || null;
}

async function findProjectForFounder(founderId, projectSlug) {
  const startup = await Startup.findOne({ founderId });
  if (!startup?._id) return null;
  return Project.findOne({
    startupId: startup._id,
    slug: projectSlug,
    founderId,
  });
}

async function liveProjectCounts(projectId) {
  const [totalMilestones, completedMilestones, totalTasks, completedTasks] =
    await Promise.all([
      Milestone.countDocuments({ projectId }),
      Milestone.countDocuments({ projectId, status: "completed" }),
      Task.countDocuments({ projectId }),
      Task.countDocuments({ projectId, status: "completed" }),
    ]);
  return {
    totalMilestones,
    completedMilestones,
    totalTasks,
    completedTasks,
  };
}

async function userBelongsToStartup(userId, startupId, founderId) {
  const user = await User.findById(userId).lean();
  if (!user) return false;
  if (String(user._id) === String(founderId)) return true;
  if (startupId && String(user.startupId) === String(startupId)) return true;
  const profile = await TeamMemberProfile.findOne({ userId }).lean();
  if (!profile) return false;
  if (startupId && String(profile.startupId) === String(startupId)) return true;
  if (String(profile.founderId) === String(founderId)) return true;
  return false;
}

export const createProject = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const payload = unwrapPayload(req, "project");
  const name = String(payload?.name || "").trim();
  if (name.length < 2 || name.length > 200) {
    return apiError(res, "Project name must be 2–200 characters.", 400);
  }

  const startupId = await resolveStartupId(founderId, payload?.startupId);
  if (!startupId) {
    return apiError(res, "Startup is required before creating a project.", 400);
  }

  const baseSlug = slugFromName(name);
  const slug = await uniqueSlugForStartup(startupId, baseSlug);

  const project = await Project.create({
    startupId,
    founderId,
    name,
    slug,
    description: String(payload?.description || "").slice(0, 5000),
    color: payload?.color || undefined,
    priority: PROJECT_PRIORITIES.includes(payload?.priority)
      ? payload.priority
      : undefined,
    startupStage: String(payload?.startupStage || "").slice(0, 200),
    startDate: payload?.startDate ? new Date(payload.startDate) : null,
    dueDate: payload?.dueDate ? new Date(payload.dueDate) : null,
    visibility: payload?.visibility === "private" ? "private" : undefined,
    githubRepo: payload?.githubRepo || undefined,
    members: [{ userId: founderId, role: "owner" }],
  });

  return apiSuccess(res, project, 201);
};

export const listProjects = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const filter = { founderId };
  const status = String(req.query?.status || "").trim();
  if (status && PROJECT_STATUSES.includes(status)) {
    filter.status = status;
  } else {
    filter.status = { $ne: "archived" };
  }

  const projects = await Project.find(filter).sort({ updatedAt: -1 });
  return apiSuccess(res, projects);
};

export const getProject = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  await project.populate("members.userId", "name email avatarUrl");
  const liveCounts = await liveProjectCounts(project._id);
  const projectObj = project.toObject ? project.toObject() : project;

  return apiSuccess(res, {
    ...projectObj,
    liveCounts,
  });
};

export const updateProject = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const payload = unwrapPayload(req, "project");
  const updates = {};

  if (payload.name != null) {
    const name = String(payload.name).trim();
    if (name.length < 2 || name.length > 200) {
      return apiError(res, "Project name must be 2–200 characters.", 400);
    }
    updates.name = name;
    const baseSlug = slugFromName(name);
    updates.slug = await uniqueSlugForStartup(
      project.startupId,
      baseSlug,
      project._id,
    );
  }
  if (payload.description != null) {
    updates.description = String(payload.description).slice(0, 5000);
  }
  if (payload.status != null && PROJECT_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.priority != null && PROJECT_PRIORITIES.includes(payload.priority)) {
    updates.priority = payload.priority;
  }
  if (payload.startDate !== undefined) {
    updates.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.dueDate !== undefined) {
    updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }
  if (payload.visibility != null) {
    updates.visibility = payload.visibility === "private" ? "private" : "team";
  }
  if (payload.color != null) {
    updates.color = String(payload.color).slice(0, 32);
  }

  if (!Object.keys(updates).length) {
    return apiSuccess(res, project);
  }

  const updated = await Project.findByIdAndUpdate(project._id, updates, {
    new: true,
    runValidators: true,
  });
  await syncProjectCounters(updated._id);

  return apiSuccess(res, updated);
};

export const archiveProject = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const updated = await Project.findByIdAndUpdate(
    project._id,
    { status: "archived" },
    { new: true, runValidators: true },
  );

  return apiSuccess(res, updated);
};

export const addMember = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const payload = unwrapPayload(req, "member");
  const userId = payload?.userId;
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return apiError(res, "Valid userId is required.", 400);
  }

  const role = PROJECT_MEMBER_ROLES.includes(payload?.role)
    ? payload.role
    : "member";

  const alreadyMember = (project.members || []).some(
    (m) => String(m.userId) === String(userId),
  );
  if (alreadyMember) {
    return apiError(res, "User is already a project member.", 400);
  }

  const belongs = await userBelongsToStartup(
    userId,
    project.startupId,
    founderId,
  );
  if (!belongs) {
    return apiError(res, "User does not belong to this startup team.", 400);
  }

  const updated = await Project.findByIdAndUpdate(
    project._id,
    {
      $push: {
        members: { userId, role, addedAt: new Date() },
      },
    },
    { new: true, runValidators: true },
  );

  return apiSuccess(res, updated);
};

export const removeMember = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const userId = req.params.userId;
  const owners = (project.members || []).filter((m) => m.role === "owner");
  const removingOwner = owners.some((m) => String(m.userId) === String(userId));
  if (removingOwner && owners.length <= 1) {
    return apiError(res, "Cannot remove the last project owner.", 400);
  }

  const updated = await Project.findByIdAndUpdate(
    project._id,
    { $pull: { members: { userId } } },
    { new: true, runValidators: true },
  );

  return apiSuccess(res, updated);
};

export const connectGithub = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const payload = unwrapPayload(req, "github") || req.body || {};
  const githubRepo = {
    owner: String(payload.owner || project.githubRepo?.owner || "").trim(),
    repo: String(payload.repo || project.githubRepo?.repo || "").trim(),
    syncEnabled:
      payload.syncEnabled !== undefined
        ? Boolean(payload.syncEnabled)
        : Boolean(project.githubRepo?.syncEnabled),
    lastSyncedAt: project.githubRepo?.lastSyncedAt || null,
  };

  const updated = await Project.findByIdAndUpdate(
    project._id,
    { githubRepo },
    { new: true, runValidators: true },
  );

  return apiSuccess(res, updated);
};

export const syncGithub = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  try {
    const result = await syncProjectIssues(project);
    const refreshed = await Project.findById(project._id).lean();
    return apiSuccess(res, {
      ...result,
      lastSyncedAt: refreshed?.githubRepo?.lastSyncedAt || new Date(),
    });
  } catch (error) {
    return apiError(res, error.message || "GitHub sync failed.", 400);
  }
};

export const getProjectMilestones = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const milestones = await Milestone.find({ projectId: project._id }).sort({
    sequence: 1,
  });
  const milestoneIds = milestones.map((m) => m._id);
  const tasks = milestoneIds.length
    ? await Task.find({ milestoneId: { $in: milestoneIds } }).sort({
        createdAt: 1,
      })
    : [];

  const tasksByMilestone = new Map();
  for (const task of tasks) {
    const key = String(task.milestoneId);
    if (!tasksByMilestone.has(key)) tasksByMilestone.set(key, []);
    tasksByMilestone.get(key).push(task);
  }

  const enriched = milestones.map((m) => {
    const row = m.toObject ? m.toObject() : m;
    const milestoneTasks = tasksByMilestone.get(String(m._id)) || [];
    return {
      ...row,
      tasks: milestoneTasks,
      taskCount: milestoneTasks.length,
    };
  });

  return apiSuccess(res, enriched);
};

export const getProjectTasks = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const project = await findProjectForFounder(founderId, req.params.projectSlug);
  if (!project) {
    return apiError(res, "Project not found.", 404);
  }

  const filter = { projectId: project._id };
  if (req.query?.status) filter.status = String(req.query.status);
  if (req.query?.milestoneId) filter.milestoneId = req.query.milestoneId;
  if (req.query?.assignedTo) filter.assignedTo = req.query.assignedTo;

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  return apiSuccess(res, tasks);
};
