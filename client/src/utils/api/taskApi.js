// Task API wrapper for backend-first task management
import { request } from "../backendClient";

function normalizeTaskList(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload)) return payload;
  return [];
}

function normalizeTask(task) {
  if (!task) return null;
  return {
    ...task,
    id: String(task.id || task._id || ""),
    blockerReason: task.blockerReason || task.blockedReason || "",
    blockerNote: task.blockerNote || task.blockedNote || "",
  };
}

/**
 * Get all tasks for a founder
 */
export async function getFounderTasks(founderId) {
  const payload = await request(`/founders/${founderId}/tasks`, { method: "GET" });
  const tasks = normalizeTaskList(payload);
  return tasks.map(normalizeTask).filter(Boolean);
}

/**
 * Get tasks assigned to a team member
 */
export async function getTeamMemberTasks(teamMemberId) {
  const payload = await request(`/team-members/${teamMemberId}/tasks`, { method: "GET" });
  const tasks = normalizeTaskList(payload);
  return tasks.map(normalizeTask).filter(Boolean);
}

/**
 * Save a task
 */
export async function saveTask(founderId, task) {
  const payload = await request(`/founders/${founderId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ task }),
  });
  return normalizeTask(payload?.data || payload?.task || task);
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  founderId,
  taskId,
  status,
  additionalData,
) {
  const payload = await request(`/founders/${founderId}/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...additionalData,
      updatedAt: new Date().toISOString(),
    }),
  });
  return normalizeTask(payload?.data || payload?.task || null);
}

/**
 * Delete a task
 */
export async function deleteTask(founderId, taskId) {
  await request(`/founders/${founderId}/tasks/${taskId}`, { method: "DELETE" });
  return true;
}

/**
 * Assign task to a team member
 */
export async function assignTask(founderId, taskId, assigneeId, assigneeName) {
  const payload = await request(`/founders/${founderId}/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({
      assigneeId,
      assigneeName,
      assignedTo: assigneeId,
      assignedToName: assigneeName,
      assignedAt: new Date().toISOString(),
    }),
  });
  return normalizeTask(payload?.data || payload?.task || null);
}

/**
 * Get tasks with pagination support
 */
export async function getTasks(founderId, params) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.pageSize) queryParams.set("pageSize", params.pageSize.toString());
  if (params?.status) queryParams.set("status", params.status);
  if (params?.search) queryParams.set("search", params.search);
  const query = queryParams.toString();
  const payload = await request(
    `/founders/${founderId}/tasks${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  const data = payload?.data || payload || {};
  return {
    tasks: normalizeTaskList(payload).map(normalizeTask).filter(Boolean),
    pagination: data.pagination,
  };
}

/**
 * Get tasks by assignee with pagination support
 */
export async function getTasksByAssignee(assigneeId, params) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.pageSize) queryParams.set("pageSize", params.pageSize.toString());
  const query = queryParams.toString();
  const payload = await request(
    `/team-members/${assigneeId}/tasks${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  const data = payload?.data || payload || {};
  return {
    tasks: normalizeTaskList(payload).map(normalizeTask).filter(Boolean),
    pagination: data.pagination,
  };
}
