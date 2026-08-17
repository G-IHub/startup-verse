import Task from "../models/Task.js";
import TaskComment from "../models/TaskComment.js";
import {
  error as apiError,
  success as apiSuccess,
} from "../utils/apiResponse.js";
import {
  canAccessStartupTask,
  isTaskFounder,
  isAllowedUploadUrl,
  parsePageParams,
} from "../utils/taskAccess.js";
import {
  createTaskComment,
  loadAuthorMap,
  mapCommentDto,
  mapLegacyComments,
} from "../services/taskCommentService.js";

function normalizeLinks(raw) {
  if (!Array.isArray(raw)) return null;
  const links = [];
  for (const row of raw) {
    const url = String(row?.url || "").trim();
    if (!url) continue;
    if (!/^https?:\/\//i.test(url)) {
      const err = new Error("Each link must be an http or https URL.");
      err.status = 422;
      throw err;
    }
    links.push({
      url: url.slice(0, 2000),
      label: String(row?.label || "").trim().slice(0, 200),
    });
  }
  return links;
}

export async function getTask(req, res) {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (String(task.founderId) !== String(req.params.founderId)) {
    return apiError(res, "Task not found.", 404);
  }
  if (!(await canAccessStartupTask(req, task))) {
    return apiError(res, "Forbidden.", 403);
  }

  const commentCount = await TaskComment.countDocuments({ taskId: task._id });
  return apiSuccess(res, {
    ...task.toObject(),
    id: String(task._id),
    commentCount,
    legacyComments: mapLegacyComments(task),
    canEditBrief: isTaskFounder(req, task),
  });
}

export async function updateTaskBrief(req, res) {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (String(task.founderId) !== String(req.params.founderId)) {
    return apiError(res, "Task not found.", 404);
  }
  if (!isTaskFounder(req, task)) {
    return apiError(res, "Forbidden.", 403);
  }

  const payload = req.body?.task && typeof req.body.task === "object"
    ? req.body.task
    : req.body || {};

  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    task.description = String(payload.description || "").slice(0, 5000);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "links")) {
    try {
      const links = normalizeLinks(payload.links);
      if (links) task.links = links;
    } catch (err) {
      return apiError(res, err.message, err.status || 422);
    }
  }

  await task.save();
  return apiSuccess(res, { ...task.toObject(), id: String(task._id) });
}

export async function addTaskAttachment(req, res) {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (String(task.founderId) !== String(req.params.founderId)) {
    return apiError(res, "Task not found.", 404);
  }
  if (!isTaskFounder(req, task)) {
    return apiError(res, "Forbidden.", 403);
  }

  const url = String(req.body?.url || "").trim();
  if (!isAllowedUploadUrl(url)) {
    return apiError(
      res,
      "Attachment URL must come from POST /uploads.",
      422,
    );
  }

  task.attachments.push({
    url,
    name: String(req.body?.name || "file").trim().slice(0, 300),
    mimeType: String(req.body?.mimeType || "").trim().slice(0, 200),
    size: Number(req.body?.size) || 0,
    uploadedBy: req.user.id,
    createdAt: new Date(),
  });
  await task.save();
  return apiSuccess(res, { ...task.toObject(), id: String(task._id) }, 201);
}

export async function deleteTaskAttachment(req, res) {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (String(task.founderId) !== String(req.params.founderId)) {
    return apiError(res, "Task not found.", 404);
  }
  if (!isTaskFounder(req, task)) {
    return apiError(res, "Forbidden.", 403);
  }

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) {
    return apiError(res, "Attachment not found.", 404);
  }
  attachment.deleteOne();
  await task.save();
  return apiSuccess(res, { ...task.toObject(), id: String(task._id) });
}

export async function listTaskComments(req, res) {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (String(task.founderId) !== String(req.params.founderId)) {
    return apiError(res, "Task not found.", 404);
  }
  if (!(await canAccessStartupTask(req, task))) {
    return apiError(res, "Forbidden.", 403);
  }

  const { page, pageSize, skip } = parsePageParams(req.query);
  const [rows, total] = await Promise.all([
    TaskComment.find({ taskId: task._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    TaskComment.countDocuments({ taskId: task._id }),
  ]);
  const authorMap = await loadAuthorMap(rows.map((row) => row.authorId));
  return apiSuccess(res, {
    comments: rows.map((row) => mapCommentDto(row, authorMap)),
    pagination: { page, pageSize, total },
    legacyComments: page === 1 ? mapLegacyComments(task) : [],
  });
}

export async function postTaskComment(req, res) {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return apiError(res, "Task not found.", 404);
  }
  if (String(task.founderId) !== String(req.params.founderId)) {
    return apiError(res, "Task not found.", 404);
  }
  if (!(await canAccessStartupTask(req, task))) {
    return apiError(res, "Forbidden.", 403);
  }

  try {
    const comment = await createTaskComment({
      task,
      authorId: req.user.id,
      body: req.body?.body || req.body?.message || "",
    });
    return apiSuccess(res, comment, 201);
  } catch (err) {
    return apiError(res, err.message, err.status || 500);
  }
}
