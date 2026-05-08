/**
 * Organization API client
 * All organization-related API calls
 */
import { API_BASE_URL } from "../../config/apiBase.js";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

/** Responses from server/src/utils/apiResponse.js use `{ success, data }`. */
function unwrapData(result) {
  if (
    result &&
    typeof result === "object" &&
    result.success === true &&
    Object.prototype.hasOwnProperty.call(result, "data")
  ) {
    return result.data;
  }
  return result;
}

/** Ensure frontend consumers get stable `id` and org `type` from settings. */
function mapEntity(entity) {
  if (!entity || typeof entity !== "object") return entity;
  const out = { ...entity };
  if (out._id != null && out.id == null) {
    out.id = String(out._id);
  }
  const ot = out.settings?.organizationType;
  if (ot != null && out.type == null) {
    out.type = String(ot);
  }
  return out;
}

function mapList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(mapEntity);
}

async function apiCall(endpoint, options = {}, silent404 = false) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
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

  return mapEntity(unwrapData(result));
}

export async function getOrganization(orgId) {
  const result = await apiCall(`/organizations/${orgId}`);
  return mapEntity(unwrapData(result));
}

export async function getUserOrganizations(userId) {
  const result = await apiCall(`/organizations/user/${userId}`);
  return mapList(unwrapData(result));
}

export async function isOrganizationAdmin(orgId, userId) {
  try {
    const result = await apiCall(`/organizations/${orgId}/is-admin/${userId}`);
    const data = unwrapData(result) ?? result;
    return Boolean(data?.isAdmin);
  } catch {
    return false;
  }
}

export async function checkAdminStatus(orgId, userId) {
  try {
    const result = await apiCall(`/organizations/${orgId}/is-admin/${userId}`);
    const data = unwrapData(result) ?? result;
    return {
      isAdmin: Boolean(data?.isAdmin),
      isCreator: Boolean(data?.isCreator),
    };
  } catch {
    return { isAdmin: false, isCreator: false };
  }
}

// ==========================================
// COHORT MANAGEMENT
// ==========================================

export async function createCohort(data) {
  const result = await apiCall("/cohorts/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return mapEntity(unwrapData(result));
}

export async function getCohort(cohortId) {
  const result = await apiCall(`/cohorts/${cohortId}`, {}, true); // Silent 404 for deleted cohorts
  return mapEntity(unwrapData(result));
}

export async function getOrganizationCohorts(orgId) {
  const result = await apiCall(`/cohorts/organization/${orgId}`);
  return mapList(unwrapData(result));
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

  return mapEntity(unwrapData(result));
}

export async function getFounderInvitations(founderId) {
  const result = await apiCall(`/invitations/founder/${founderId}`);
  return mapList(unwrapData(result));
}

export async function respondToInvitation(invitationId, founderId, status) {
  const result = await apiCall(`/invitations/${invitationId}/respond`, {
    method: "POST",
    body: JSON.stringify({ status, founderId }),
  });

  return mapEntity(unwrapData(result));
}

// ==========================================
// COHORT MEMBERSHIP & DATA ACCESS
// ==========================================

export async function getCohortMembers(cohortId) {
  const result = await apiCall(`/cohorts/${cohortId}/members`);
  return mapList(unwrapData(result));
}

export async function getFounderMemberships(founderId) {
  const result = await apiCall(`/memberships/founder/${founderId}`);
  const data = unwrapData(result);
  const items = Array.isArray(data) ? data : [];
  return { success: true, memberships: mapList(items) };
}

export async function getStartupSnapshot(founderId) {
  const result = await apiCall(`/startups/${founderId}/snapshot`);
  return unwrapData(result);
}

// ==========================================
// USER SEARCH
// ==========================================

export async function searchUserByEmail(email) {
  const result = await apiCall("/users/search-by-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const data = unwrapData(result);
  const user = data?.user ?? null;
  return user ? mapEntity(user) : null;
}
