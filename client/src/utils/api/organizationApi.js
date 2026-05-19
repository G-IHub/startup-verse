/**
 * Organization API client
 * All organization-related API calls
 */
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  buildListQueryString,
  fetchOrgList,
  normalizeListPage,
  unwrapListPage,
} from "./listQuery.js";

export { buildListQueryString, fetchOrgList, normalizeListPage, unwrapListPage };

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

export async function getCohortBadgeCounts(cohortId) {
  const result = await apiCall(`/cohorts/${cohortId}/badge-counts`);
  return unwrapData(result);
}

function parseContentDispositionFilename(header) {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      return star[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  return plain ? plain[1].trim().replace(/^"|"$/g, "") : null;
}

/**
 * Download cohort export CSV from GET /cohorts/:cohortId/export (Step 4.2 / O3).
 * Triggers a browser file save; does not use apiCall (response is not JSON).
 */
export async function downloadCohortExport(cohortId, { format = "csv" } = {}) {
  const fmt = format === "json" ? "json" : "csv";
  const url = `${API_BASE_URL}/cohorts/${cohortId}/export?format=${encodeURIComponent(fmt)}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      try {
        const text = await response.text();
        if (text) message = text.slice(0, 200);
      } catch {
        /* ignore */
      }
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(
      response.headers.get("Content-Disposition"),
    ) || (fmt === "json" ? "cohort-export.json" : "cohort-export.csv");

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);

  return {
    truncated: response.headers.get("X-Export-Truncated") === "true",
  };
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

export async function updateCohort(cohortId, patch) {
  const result = await apiCall(`/cohorts/${cohortId}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return mapEntity(unwrapData(result));
}

// ==========================================
// COHORT ANNOUNCEMENTS (Step 2.8)
// ==========================================

export async function updateCohortAnnouncement(cohortId, announcementId, patch) {
  const result = await apiCall(
    `/cohorts/${cohortId}/announcements/${announcementId}`,
    {
      method: "PUT",
      body: JSON.stringify(patch),
    },
  );
  return unwrapData(result);
}

export async function deleteCohortAnnouncement(cohortId, announcementId) {
  const result = await apiCall(
    `/cohorts/${cohortId}/announcements/${announcementId}`,
    { method: "DELETE" },
  );
  return unwrapData(result);
}

export async function markCohortAnnouncementRead(cohortId, announcementId) {
  const result = await apiCall(
    `/cohorts/${cohortId}/announcements/${announcementId}/read`,
    { method: "POST" },
  );
  return unwrapData(result);
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

export async function getCohortMembers(cohortId, params = {}) {
  const page = await fetchOrgList(`/cohorts/${cohortId}/members`, {
    limit: 100,
    ...params,
  });
  return mapList(page.items);
}

/** Paginated cohort members (Step 3.1). */
export async function getCohortMembersPage(cohortId, params = {}) {
  const page = await fetchOrgList(`/cohorts/${cohortId}/members`, params);
  return { ...page, items: mapList(page.items) };
}

export async function getOrganizationMentorsPage(orgId, params = {}) {
  return fetchOrgList(`/organizations/${orgId}/mentors`, params);
}

export async function getCohortResourcesPage(cohortId, params = {}) {
  return fetchOrgList(`/cohorts/${cohortId}/resources`, params);
}

export async function getCohortEventsPage(cohortId, params = {}) {
  return fetchOrgList(`/cohorts/${cohortId}/events`, params);
}

export async function getCohortAnnouncementsPage(cohortId, params = {}) {
  return fetchOrgList(`/cohorts/${cohortId}/announcements`, params);
}

export async function getCohortDeliverablesPage(cohortId, params = {}) {
  return fetchOrgList(`/cohorts/${cohortId}/deliverables`, params);
}

export async function getDeliverableSubmissionsPage(deliverableId, params = {}) {
  return fetchOrgList(`/deliverables/${deliverableId}/submissions`, params);
}

export async function getProgramMilestonesPage(cohortId, params = {}) {
  return fetchOrgList(`/cohorts/${cohortId}/program-milestones`, params);
}

export async function getOrganizationMessagesPage(orgId, params = {}) {
  return fetchOrgList(`/messages/organization/${orgId}`, params);
}

export async function getFounderMemberships(founderId) {
  const result = await apiCall(`/memberships/founder/${founderId}`);
  const data = unwrapData(result);
  const items = Array.isArray(data) ? data : [];
  return { success: true, memberships: mapList(items) };
}

/**
 * Fetch the per-startup snapshot. Accepts either a Startup `_id` (canonical)
 * or the founder's User `_id` — the server resolves both. See Step 2.9.
 */
export async function getStartupSnapshot(idOrFounderId) {
  const result = await apiCall(`/startups/${idOrFounderId}/snapshot`);
  return unwrapData(result);
}

// ==========================================
// MENTOR MUTATIONS
// ==========================================

/**
 * Step 2.10 — update a mentor's expertise (CSV string or string[]) and / or
 * status (`active` | `revoked`). Returns the updated mentor DTO.
 */
export async function updateMentor(mentorId, patch) {
  const result = await apiCall(`/mentors/${mentorId}`, {
    method: "PUT",
    body: JSON.stringify(patch || {}),
  });
  const data = unwrapData(result);
  return data?.mentor ?? data;
}

// ==========================================
// COHORT INVITATIONS — cancel / resend / list (Step 2.13)
// ==========================================

// These helpers bypass apiCall on the failure path so callers can branch on
// the server's `code` field (e.g. INVITATION_RESEND_TOO_SOON). On error they
// throw an Error decorated with { status, code, message, errors,
// retryAfterSeconds }.
async function invitationFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      payload?.message || `Request failed (${response.status})`,
    );
    err.status = response.status;
    err.code = payload?.code || "";
    err.errors = Array.isArray(payload?.errors) ? payload.errors : [];
    const ra = err.errors.find?.((e) => typeof e?.retryAfterSeconds === "number");
    if (ra) err.retryAfterSeconds = ra.retryAfterSeconds;
    throw err;
  }
  return unwrapData(payload);
}

export async function cancelInvitation(invitationId) {
  return invitationFetch(`/invitations/${invitationId}/cancel`, {
    method: "POST",
  });
}

export async function resendInvitation(invitationId) {
  return invitationFetch(`/invitations/${invitationId}/resend`, {
    method: "POST",
  });
}

/** Paginated cohort invitations (Step 3.1). */
export async function getCohortInvitationsPage(cohortId, params = {}) {
  return fetchOrgList(`/cohorts/${cohortId}/invitations`, params);
}

export async function listCohortInvitations(cohortId, { status = "pending" } = {}) {
  const page = await getCohortInvitationsPage(cohortId, { status, limit: 100 });
  return page.items;
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
