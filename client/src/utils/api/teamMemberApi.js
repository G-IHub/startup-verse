/**
 * Team Member API Client
 *
 * Frontend API functions for Team Member backend operations.
 * All functions handle errors gracefully and provide detailed logging.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Pagination types

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    // Silently fail in development mode (expected when backend isn't running)
    if (import.meta.env.DEV) {
      console.debug(
        `Backend API [${endpoint}] not available, using localStorage data`,
      );
    } else {
      console.error(`❌ API Error [${endpoint}]:`, error);
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
  console.log(`📤 Saving team member profile: ${userId}`);

  const result = await apiRequest("/team-members/profile", {
    method: "POST",
    body: JSON.stringify({ userId, profileData }),
  });

  console.log(`✅ Team member profile saved: ${userId}`);
  return result;
}

/**
 * Get team member profile by ID
 */
export async function getTeamMemberProfile(userId) {
  console.log(`📥 Fetching team member profile: ${userId}`);

  const result = await apiRequest(`/team-members/profile/${userId}`, {
    method: "GET",
  });

  console.log(`✅ Team member profile fetched: ${userId}`);
  return result.profile;
}

/**
 * Get all team members in a startup
 */
export async function getStartupTeamMembers(startupId, params = {}) {
  console.log(`📥 Fetching team members for startup: ${startupId}`);

  const queryString = buildQueryString(params);
  const result = await apiRequest(
    `/startups/${startupId}/team-members${queryString}`,
    {
      method: "GET",
    },
  );

  console.log(
    `✅ Team members fetched: ${result.pagination?.total || result.count} members`,
  );
  return result.teamMembers || result.items;
}

// ==========================================
// TASK MANAGEMENT
// ==========================================

/**
 * Get tasks assigned to team member
 */
export async function getTeamMemberTasks(teamMemberId, params = {}) {
  console.log(`📥 Fetching tasks for team member: ${teamMemberId}`);

  const queryString = buildQueryString(params);
  const result = await apiRequest(
    `/team-members/${teamMemberId}/tasks${queryString}`,
    {
      method: "GET",
    },
  );

  console.log(
    `✅ Tasks fetched: ${result.pagination?.total || result.count} tasks assigned`,
  );
  return result.tasks || result.items;
}

/**
 * Update task status (complete, block, etc.)
 *
 * IMPORTANT: This function now uses the founder's task endpoint directly
 * since team member tasks are stored under the founder's namespace.
 * The founderId should be passed from the component context.
 */
export async function updateTaskStatus(teamMemberId, taskId, updates) {
  console.log(
    `📤 [NOTIFICATION SYSTEM] Team member ${teamMemberId} updating task ${taskId}`,
  );
  console.log(
    `📦 [NOTIFICATION SYSTEM] Status: ${updates.status}, Founder: ${updates.founderId}`,
  );

  // ALWAYS use team-member endpoint - it triggers notifications properly
  try {
    const endpoint = `/team-members/${teamMemberId}/tasks/${taskId}`;
    console.log(`🌐 [NOTIFICATION SYSTEM] POST ${endpoint}`);

    const result = await apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    console.log(`✅ [NOTIFICATION SYSTEM] Task updated successfully!`);
    console.log(
      `📬 [NOTIFICATION SYSTEM] Notification should be created for founder ${updates.founderId}`,
    );
    return result.task;
  } catch (error) {
    console.error(`❌ [NOTIFICATION SYSTEM] Failed to update task:`, error);
    throw error;
  }
}

/**
 * Add comment to a task
 */
export async function addTaskComment(teamMemberId, taskId, comment, userName) {
  console.log(`📤 Adding comment to task: ${taskId}`);

  const result = await apiRequest(
    `/team-members/${teamMemberId}/tasks/${taskId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ comment, userName }),
    },
  );

  console.log(`✅ Comment added to task: ${taskId}`);
  return result.comment;
}

// ==========================================
// ACTIVITY TRACKING
// ==========================================

/**
 * Get team member activity log
 */
export async function getTeamMemberActivity(teamMemberId, params = {}) {
  console.log(`📥 Fetching activity for team member: ${teamMemberId}`);

  const queryString = buildQueryString(params);
  const result = await apiRequest(
    `/team-members/${teamMemberId}/activity${queryString}`,
    {
      method: "GET",
    },
  );

  console.log(
    `✅ Activity fetched: ${result.pagination?.total || result.count} activities`,
  );
  return result.activities || result.items;
}

// ==========================================
// STATUS UPDATES
// ==========================================

/**
 * Save team member status update
 */
export async function saveTeamMemberStatus(teamMemberId, statusText, mood) {
  console.log(`📤 Saving status for team member: ${teamMemberId}`);

  const result = await apiRequest(`/team-members/${teamMemberId}/status`, {
    method: "POST",
    body: JSON.stringify({ statusText, mood }),
  });

  console.log(`✅ Status saved: ${teamMemberId}`);
  return result.status;
}

/**
 * Get team member's current status
 */
export async function getTeamMemberStatus(teamMemberId) {
  console.log(`📥 Fetching status for team member: ${teamMemberId}`);

  const result = await apiRequest(`/team-members/${teamMemberId}/status`, {
    method: "GET",
  });

  console.log(`✅ Status fetched: ${teamMemberId}`);
  return result.status;
}

// ==========================================
// EXPORT ALL
// ==========================================

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
