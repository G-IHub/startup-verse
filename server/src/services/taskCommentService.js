import TaskComment from "../models/TaskComment.js";
import User from "../models/User.js";
import { createNotification } from "./notificationService.js";
import { taskPageDeepLink } from "../utils/deepLinks.js";

export function mapLegacyComments(task) {
  const rows = Array.isArray(task?.comments) ? task.comments : [];
  return rows
    .filter((row) => row && (row.message || row.body))
    .map((row, index) => ({
      id: `legacy-${index}`,
      authorId: row.by || row.authorId || "",
      authorName: row.authorName || "",
      body: String(row.message || row.body || "").trim(),
      createdAt: row.at || row.createdAt || null,
      legacy: true,
    }));
}

export function mapCommentDto(row, authorMap = {}) {
  const authorId = String(row.authorId || "");
  const author = authorMap[authorId];
  return {
    id: String(row._id),
    taskId: String(row.taskId),
    startupId: String(row.startupId || ""),
    authorId,
    authorName: author?.name || "",
    authorAvatar: author?.profileImage || author?.avatar || "",
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    legacy: false,
  };
}

export async function loadAuthorMap(authorIds) {
  const ids = [...new Set(authorIds.map((id) => String(id || "")).filter(Boolean))];
  if (ids.length === 0) return {};
  const users = await User.find({ _id: { $in: ids } }, { name: 1, profileImage: 1 }).lean();
  const map = {};
  for (const user of users) {
    map[String(user._id)] = user;
  }
  return map;
}

export async function createTaskComment({ task, authorId, body }) {
  const trimmed = String(body || "").trim();
  if (!trimmed) {
    const err = new Error("Comment body is required.");
    err.status = 422;
    throw err;
  }

  const comment = await TaskComment.create({
    taskId: task._id,
    startupId: task.startupId,
    authorId,
    body: trimmed.slice(0, 5000),
  });

  const recipients = new Set();
  if (task.founderId) recipients.add(String(task.founderId));
  if (task.assignedTo) recipients.add(String(task.assignedTo));
  recipients.delete(String(authorId));

  const author = await User.findById(authorId, { name: 1 }).lean();
  const authorName = author?.name || "A teammate";
  const actionUrl = taskPageDeepLink(task._id);

  await Promise.all(
    [...recipients].map((userId) =>
      createNotification({
        userId,
        type: "task-comment",
        title: "New comment on a task",
        message: `${authorName} commented on ${task.title}`,
        actionUrl,
        metadata: {
          taskId: String(task._id),
          commentId: String(comment._id),
          startupId: String(task.startupId || ""),
        },
      }),
    ),
  );

  const authorMap = await loadAuthorMap([authorId]);
  return mapCommentDto(comment, authorMap);
}
