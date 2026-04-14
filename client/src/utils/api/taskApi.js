// Task API wrapper for backend-first task management
import { request } from "../backendClient";

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
  const tasks = payload?.data?.tasks || payload?.tasks || [];
  return tasks.map(normalizeTask).filter(Boolean);
}

/**
 * Get tasks assigned to a team member
 */
export async function getTeamMemberTasks(teamMemberId) {
  const payload = await request(`/team-members/${teamMemberId}/tasks`, { method: "GET" });
  const tasks = payload?.data?.tasks || payload?.tasks || [];
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
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.pageSize)
      queryParams.set("pageSize", params.pageSize.toString());
    if (params?.status) queryParams.set("status", params.status);
    if (params?.search) queryParams.set("search", params.search);

    const queryString = queryParams.toString();
    const url = `${API_BASE}/founders/${founderId}/tasks${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      tasks: data.tasks || [],
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

/**
 * Get tasks by assignee with pagination support
 */
export async function getTasksByAssignee(assigneeId, params) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.pageSize)
      queryParams.set("pageSize", params.pageSize.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE}/team-members/${assigneeId}/tasks${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch tasks by assignee: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return {
      tasks: data.tasks || [],
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching tasks by assignee:", error);
    throw error;
  }
}
