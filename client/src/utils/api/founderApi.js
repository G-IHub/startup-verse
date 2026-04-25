/**
 * Founder API Client
 * Handles all backend API calls for Founder users
 */

import { request, tryRequest } from "../backendClient";

// Pagination types

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const payload = await request(endpoint, options);
    return payload.data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
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
// User & Profile Management
// ==========================================

/**
 * POST /founders/profile — body must match server `createOrUpdateProfile`.
 */
export async function saveFounderProfile({
  userId,
  startupId,
  bio = "",
  background = "",
  links = {},
}) {
  return apiCall("/founders/profile", {
    method: "POST",
    body: JSON.stringify({
      userId,
      startupId,
      bio,
      background,
      links,
    }),
  });
}

export async function getFounderProfile(userId) {
  return apiCall(`/founders/profile/${userId}`);
}

export async function getAllFounders(params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/founders${queryString}`);
}

// ==========================================
// Startup/Company Data
// ==========================================

/**
 * POST /founders/startup — upsert by founderId (matches `createOrUpdateStartup`).
 */
export async function upsertFounderStartup({
  founderId,
  name,
  description = "",
  industry = "",
  stage = "",
  website = "",
  logo = "",
  data,
}) {
  return apiCall("/founders/startup", {
    method: "POST",
    body: JSON.stringify({
      founderId,
      name,
      description,
      industry,
      stage,
      website,
      logo,
      ...(data !== undefined ? { data } : {}),
    }),
  });
}

/** @deprecated Use `upsertFounderStartup` */
export async function saveStartupData(startupId, founderId, startupData) {
  return upsertFounderStartup({
    founderId,
    name: startupData?.name || "",
    description: startupData?.description,
    industry: startupData?.industry,
    stage: startupData?.stage,
    website: startupData?.website,
    logo: startupData?.logo,
    data: startupData?.data,
  });
}

export async function getStartupData(startupId) {
  return apiCall(`/founders/startup/${startupId}`);
}

export async function getFounderStartup(founderId) {
  return apiCall(`/founders/${founderId}/startup`);
}

/** Returns startup doc or null if missing / error (no throw). */
export async function getFounderStartupSafe(founderId) {
  const payload = await tryRequest(`/founders/${founderId}/startup`);
  return payload?.data ?? null;
}

// ==========================================
// Team Invitations
// ==========================================

export async function createInvitation(invitation) {
  return apiCall("/founders/invitations", {
    method: "POST",
    body: JSON.stringify({ invitation }),
  });
}

export async function getFounderInvitations(founderId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/founders/${founderId}/invitations${queryString}`);
}

export async function getInvitationByToken(token) {
  return apiCall(`/invitations/token/${token}`);
}

export async function updateInvitationStatus(invitationId, status) {
  return apiCall(`/invitations/${invitationId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ==========================================
// Core Engine - Milestones
// ==========================================

export async function saveMilestone(founderId, milestone) {
  return apiCall(`/founders/${founderId}/milestones`, {
    method: "POST",
    body: JSON.stringify({ milestone }),
  });
}

export async function getMilestones(founderId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/founders/${founderId}/milestones${queryString}`);
}

export async function deleteMilestone(founderId, milestoneId) {
  return apiCall(`/founders/${founderId}/milestones/${milestoneId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Core Engine - Tasks
// ==========================================

export async function saveTask(founderId, task) {
  return apiCall(`/founders/${founderId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ task }),
  });
}

export async function getTasks(founderId, params = {}, bustCache = false) {
  const queryString = buildQueryString(params);
  const cacheBuster = bustCache
    ? `${queryString ? "&" : "?"}_t=${Date.now()}`
    : "";
  return apiCall(`/founders/${founderId}/tasks${queryString}${cacheBuster}`);
}

export async function deleteTask(founderId, taskId) {
  return apiCall(`/founders/${founderId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Core Engine - Weekly Outcomes
// ==========================================

export async function saveWeeklyOutcome(founderId, outcome) {
  return apiCall(`/founders/${founderId}/weekly-outcomes`, {
    method: "POST",
    body: JSON.stringify({ outcome }),
  });
}

export async function getWeeklyOutcomes(founderId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/founders/${founderId}/weekly-outcomes${queryString}`);
}

export async function parseFounderIntent(founderId, input) {
  return apiCall(`/founders/${founderId}/intent-parse`, {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

// ==========================================
// Startup Posts (for Talent Matching)
// ==========================================

export async function saveStartupPost(founderId, post) {
  return apiCall(`/founders/${founderId}/posts`, {
    method: "POST",
    body: JSON.stringify({ post }),
  });
}

export async function getFounderPosts(founderId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/founders/${founderId}/posts${queryString}`);
}

export async function getAllPosts(params = {}) {
  const queryString = buildQueryString(params);
  const data = await apiCall(`/talent/startup-posts${queryString}`);
  const posts = data.posts || [];
  const page = data.page || 1;
  const pageSize = data.pageSize || 50;
  const total = typeof data.total === "number" ? data.total : posts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    success: true,
    posts,
    opportunities: posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function deletePost(founderId, postId) {
  return apiCall(`/founders/${founderId}/posts/${postId}`, {
    method: "DELETE",
  });
}
