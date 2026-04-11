/**
 * Organization API client
 * All organization-related API calls
 */
import { getAccessToken } from "../../app/session";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function apiCall(endpoint, options = {}, silent404 = false) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Silently handle 404 errors if requested (for deleted cohorts)
      if (response.status === 404 && silent404) {
        throw new Error(
          `API Error (${response.status}): ${errorText || response.statusText}`,
        );
      }

      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(
        `API Error (${response.status}): ${errorText || response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    // Only log if not a silent 404
    if (!(error.message.includes("404") && silent404)) {
      console.error("API Call failed:", error);
    }

    // Re-throw with more context
    if (error.message.includes("404")) {
      throw new Error(
        "BACKEND_NOT_DEPLOYED: Backend endpoints not found (404). Please verify backend deployment.",
      );
    }
    throw error;
  }
}

// ==========================================
// ORGANIZATION MANAGEMENT
// ==========================================

export async function createOrganization(data) {
  const result = await apiCall("/organizations/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return result.organization;
}

export async function getOrganization(orgId) {
  const result = await apiCall(`/organizations/${orgId}`);
  return result.organization;
}

export async function getUserOrganizations(userId) {
  const result = await apiCall(`/organizations/user/${userId}`);
  return result.organizations;
}

export async function isOrganizationAdmin(orgId, userId) {
  const result = await apiCall(`/organizations/${orgId}/is-admin/${userId}`);
  return result.isAdmin;
}

export async function checkAdminStatus(orgId, userId) {
  const result = await apiCall(`/organizations/${orgId}/is-admin/${userId}`);
  return { isAdmin: result.isAdmin, isCreator: result.isCreator || false };
}

// ==========================================
// COHORT MANAGEMENT
// ==========================================

export async function createCohort(data) {
  const result = await apiCall("/cohorts/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return result.cohort;
}

export async function getCohort(cohortId) {
  const result = await apiCall(`/cohorts/${cohortId}`, {}, true); // Silent 404 for deleted cohorts
  return result.cohort;
}

export async function getOrganizationCohorts(orgId) {
  const result = await apiCall(`/cohorts/organization/${orgId}`);
  return result.cohorts;
}

export async function deleteCohort(cohortId, userId) {
  await apiCall(`/cohorts/${cohortId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

// ==========================================
// INVITATION MANAGEMENT
// ==========================================

export async function createInvitation(data) {
  // 🔍 DEBUG: Log what we're sending
  console.log(
    "🔍 [organizationApi.createInvitation] Sending data:",
    JSON.stringify(data, null, 2),
  );

  const result = await apiCall("/invitations/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

  console.log("✅ [organizationApi.createInvitation] Received result:", result);

  return result.invitation;
}

export async function getFounderInvitations(founderId) {
  const result = await apiCall(`/invitations/founder/${founderId}`);
  return result.invitations;
}

export async function respondToInvitation(invitationId, founderId, status) {
  const result = await apiCall(`/invitations/${invitationId}/respond`, {
    method: "POST",
    body: JSON.stringify({ status, founderId }),
  });

  return result.invitation;
}

// ==========================================
// COHORT MEMBERSHIP & DATA ACCESS
// ==========================================

export async function getCohortMembers(cohortId) {
  const result = await apiCall(`/cohorts/${cohortId}/members`);
  return result.members;
}

export async function getFounderMemberships(founderId) {
  const result = await apiCall(`/memberships/founder/${founderId}`);
  return result;
}

export async function getStartupSnapshot(founderId) {
  const result = await apiCall(`/startups/${founderId}/snapshot`);
  return result.snapshot;
}

// ==========================================
// USER SEARCH
// ==========================================

export async function searchUserByEmail(email) {
  const result = await apiCall("/users/search-by-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  return result.user;
}
