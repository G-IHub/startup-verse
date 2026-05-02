/**
 * Offline-first Task API
 * Works offline and syncs when back online
 */

import { offlineStorage } from "../offlineStorage";
import { API_BASE_URL } from "../../config/apiBase.js";
import { executeWithOfflineSupport } from "../syncManager";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Get tasks for team member (with offline support)
 */
export async function getTeamMemberTasks(teamMemberId, isOnline) {
  if (isOnline) {
    // Online - fetch from backend and cache
    try {
      const response = await fetch(
        `${API_BASE}/team-members/${teamMemberId}/tasks`,
        {
          ...defaultOptions,
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const tasks = data.tasks || [];

      // Cache in IndexedDB for offline access
      await offlineStorage.saveTasks(tasks);

      console.log(`✅ Fetched ${tasks.length} tasks from backend`);
      return tasks;
    } catch (error) {
      console.error("❌ Failed to fetch tasks from backend:", error);
      // Fallback to offline cache
      return await offlineStorage.getTasks(teamMemberId);
    }
  } else {
    // Offline - load from IndexedDB
    console.log("📴 Offline mode - loading tasks from cache");
    return await offlineStorage.getTasks(teamMemberId);
  }
}

/**
 * Update task status (with offline support)
 */
export async function updateTaskStatus(
  teamMemberId,
  taskId,
  updates,

  isOnline,
) {
  const endpoint = `${API_BASE}/team-members/${teamMemberId}/tasks/${taskId}`;

  const action = {
    type: "task-update",
    endpoint,
    method: "PUT",
    data: updates,
  };

  // Update local cache immediately for optimistic UI
  const cachedTasks = await offlineStorage.getTasks(teamMemberId);
  const taskIndex = cachedTasks.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1) {
    cachedTasks[taskIndex] = {
      ...cachedTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await offlineStorage.saveTasks(cachedTasks);
    console.log("✅ Task updated in offline cache");
  }

  // Execute with offline support
  return await executeWithOfflineSupport(action, isOnline);
}

/**
 * Add comment to task (with offline support)
 */
export async function addTaskComment(
  teamMemberId,
  taskId,
  comment,
  userName,
  isOnline,
) {
  const endpoint = `${API_BASE}/team-members/${teamMemberId}/tasks/${taskId}/comments`;

  const action = {
    type: "task-comment",
    endpoint,
    method: "POST",
    data: { comment, userName },
  };

  return await executeWithOfflineSupport(action, isOnline);
}

/**
 * Save team member status (with offline support)
 */
export async function saveTeamMemberStatus(
  teamMemberId,
  statusText,
  mood,
  isOnline,
) {
  const endpoint = `${API_BASE}/team-members/${teamMemberId}/status`;

  const action = {
    type: "status-update",
    endpoint,
    method: "POST",
    data: { statusText, mood },
  };

  return await executeWithOfflineSupport(action, isOnline);
}
