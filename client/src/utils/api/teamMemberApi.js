/**
 * Team Member API Client
 *
 * Frontend API functions for Team Member backend operations.
 * All functions handle errors gracefully and provide detailed logging.
 */

import { request } from "../backendClient";

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const payload = await request(endpoint, options);
    return payload.data;
  } catch (error) {
    // Silently fail in development mode (expected when backend isn't running)
    if (import.meta.env.DEV) {
      console.debug(
        `Backend API [${endpoint}] not available, using localStorage data`,
      );
    } else {
      console.error(`API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

// Helper to build query string from params
function buildQueryString(params) {
  const query = new URLSearchParams();

  if (params.page) query.append("page", params.page.toString());
  if (params.pageSize) query.append("pageSize", params.pageSize.toString());
  if (params.search) query.append("search", params.search);

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value.toString());
      }
    });
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

/**
 * Save team member profile
 */
export async function saveTeamMemberProfile(userId, profileData) {
  console.log(`Saving team member profile: ${userId}`);

  const result = await apiRequest("/team-members/profile", {
    method: "POST",
    body: JSON.stringify({ userId, profileData }),
  });

  console.log(`Team member profile saved: ${userId}`);
  return result;
}

/**
 * Get team member profile by ID
 */
export async function getTeamMemberProfile(userId) {
  console.log(`Fetching team member profile: ${userId}`);

  const result = await apiRequest(`/team-members/profile/${userId}`, {
    method: "GET",
  });

  console.log(`Team member profile fetched: ${userId}`);
  return result.profile || result;
}

/**
 * Get all team members in a startup
 */
export async function getStartupTeamMembers(startupId, params = {}) {
  console.log(`Fetching team members for startup: ${startupId}`);

  // Primary contract: derive active team context from presence rows.
  try {
    const presenceRows = await apiRequest(`/presence/${startupId}`, {
      method: "GET",
    });
    const members = (Array.isArray(presenceRows) ? presenceRows : [])
      .map((row) => ({
        id: String(row.userId || row.id || ""),
        userId: String(row.userId || row.id || ""),
        name: String(row.userName || row.name || "Team member"),
        role: String(row.role || "team-member"),
        isOnline: Boolean(row.isOnline),
        statusText: String(row.statusText || ""),
        mood: String(row.mood || ""),
        startupId: String(row.startupId || startupId || ""),
        lastSeenAt: row.lastSeenAt || row.updatedAt || null,
      }))
      .filter((row) => row.id);

    console.log(`Team context fetched from presence: ${members.length}`);
    return members;
  } catch {
    // Backward-compatible fallback for older environments.
    const queryString = buildQueryString(params);
    const result = await apiRequest(
      `/startups/${startupId}/team-members${queryString}`,
      {
        method: "GET",
      },
    );

    console.log(
      `Team members fetched: ${result.pagination?.total || result.count} members`,
    );
    return result.teamMembers || result.items || [];
  }
}

// ==========================================
// TASK MANAGEMENT
// ==========================================

/**
 * Get tasks assigned to team member
 */
export async function getTeamMemberTasks(teamMemberId, params = {}) {
  console.log(`Fetching tasks for team member: ${teamMemberId}`);

  const queryString = buildQueryString(params);
  const result = await apiRequest(
    `/team-members/${teamMemberId}/tasks${queryString}`,
    {
      method: "GET",
    },
  );

  console.log(
    `Tasks fetched: ${result.pagination?.total || result.count || result.length || 0} tasks assigned`,
  );
  return result.tasks || result.items || result || [];
}

/**
 * Update task status (complete, block, etc.)
 *
 * Uses founder endpoint when founderId exists, then falls back to canonical
 * team-member endpoint for compatibility.
 */
export async function updateTaskStatus(teamMemberId, taskId, updates) {
  console.log(`Team member ${teamMemberId} updating task ${taskId}`);

  const hasFounder = Boolean(updates?.founderId);
  const founderEndpoint = `/founders/${updates?.founderId}/tasks/${taskId}/status`;
  const memberEndpoint = `/team-members/${teamMemberId}/tasks/${taskId}`;

  if (hasFounder) {
    try {
      const founderResult = await apiRequest(founderEndpoint, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return founderResult.task || founderResult;
    } catch {
      // Fallback to canonical endpoint below.
    }
  }

  const memberResult = await apiRequest(memberEndpoint, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  return memberResult.task || memberResult;
}

/**
 * Add comment to a task
 */
export async function addTaskComment(teamMemberId, taskId, comment, userName) {
  console.log(`Adding comment to task: ${taskId}`);

  const result = await apiRequest(
    `/team-members/${teamMemberId}/tasks/${taskId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ message: comment, userName }),
    },
  );

  console.log(`Comment added to task: ${taskId}`);
  return result.comment || result;
}

// ==========================================
// ACTIVITY TRACKING
// ==========================================

/**
 * Get team member activity log
 */
export async function getTeamMemberActivity(teamMemberId, params = {}) {
  console.log(`Fetching activity for team member: ${teamMemberId}`);

  const queryString = buildQueryString(params);
  const result = await apiRequest(
    `/team-members/${teamMemberId}/activity${queryString}`,
    {
      method: "GET",
    },
  );

  console.log(
    `Activity fetched: ${result.pagination?.total || result.count || result.length || 0} activities`,
  );
  return result.activities || result.items || result || [];
}

// ==========================================
// STATUS UPDATES
// ==========================================

/**
 * Save team member status update
 */
export async function saveTeamMemberStatus(
  teamMemberId,
  statusPayloadOrText,
  mood,
) {
  console.log(`Saving status for team member: ${teamMemberId}`);

  const payload =
    statusPayloadOrText && typeof statusPayloadOrText === "object"
      ? statusPayloadOrText
      : {
          status: "available",
          note: String(statusPayloadOrText || ""),
          mood: String(mood || ""),
        };

  const requestBody = {
    status: String(payload.status || "available"),
    note: String(payload.note || payload.statusText || ""),
    startupId: payload.startupId || null,
    mood: String(payload.mood || ""),
  };

  const result = await apiRequest(`/team-members/${teamMemberId}/status`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  console.log(`Status saved: ${teamMemberId}`);
  return result && typeof result === "object"
    ? {
        ...result,
        status: String(result.status || requestBody.status),
        note: String(result.note || requestBody.note || ""),
      }
    : {
        teamMemberId,
        status: requestBody.status,
        note: requestBody.note,
      };
}

/**
 * Get team member's current status
 */
export async function getTeamMemberStatus(teamMemberId) {
  console.log(`Fetching status for team member: ${teamMemberId}`);

  const result = await apiRequest(`/team-members/${teamMemberId}/status`, {
    method: "GET",
  });

  console.log(`Status fetched: ${teamMemberId}`);
  if (!result || typeof result !== "object") {
    return { teamMemberId, status: "available", note: "" };
  }

  return {
    ...result,
    teamMemberId: String(result.teamMemberId || teamMemberId),
    status: String(result.status || "available"),
    note: String(result.note || result.statusText || ""),
  };
}

export default {
  // Profile
  saveTeamMemberProfile,
  getTeamMemberProfile,
  getStartupTeamMembers,

  // Tasks
  getTeamMemberTasks,
  updateTaskStatus,
  addTaskComment,

  // Activity
  getTeamMemberActivity,

  // Status
  saveTeamMemberStatus,
  getTeamMemberStatus,
};
