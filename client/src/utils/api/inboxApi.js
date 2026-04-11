import { request } from "../backendClient";

// Pagination types

// Helper to build query string
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

async function apiRequest(endpoint, options = {}) {
  const payload = await request(endpoint, options);
  return payload.data;
}

// ==========================================
// ORGANIZATION INVITATIONS
// ==========================================

// Get organization invitations for a founder
export async function getOrganizationInvitations(founderId) {
  console.log(
    "🔍 [InboxAPI] Fetching organization invitations for founder:",
    founderId,
  );
  console.log(
    "🔍 [InboxAPI] URL:",
    `${BASE_URL}/invitations/founder/${founderId}`,
  );

  const result = await apiRequest(`/invitations/founder/${founderId}`);
  console.log("✅ [InboxAPI] Organization invitations received:", result);

  const invitations = result.invitations || [];
  console.log(
    "📊 [InboxAPI] Parsed invitations count:",
    invitations.length,
    invitations,
  );

  return invitations;
}

// Respond to organization invitation
export async function respondToOrganizationInvitation(
  invitationId,
  founderId,
  accept,
) {
  return apiRequest(`/invitations/${invitationId}/respond`, {
    method: "POST",
    body: JSON.stringify({
      status: accept ? "accepted" : "declined",
      founderId,
    }),
  });
}

// Send interest (Talent expressing interest in a startup)
export async function sendInterest(interest) {
  return apiRequest("/interests/send", {
    method: "POST",
    body: JSON.stringify({ interest }),
  });
}

// Get interests received by a founder
export async function getReceivedInterests(founderId, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const data = await apiRequest(
      `/interests/received/${founderId}${queryString}`,
      { method: "GET" },
    );
    return data.interests || data.items || [];
  } catch (error) {
    // Debug log only - backend is optional in demo mode
    if (import.meta.env.DEV) {
      console.debug(
        "Backend getReceivedInterests failed (using localStorage fallback):",
        error.message,
      );
    }
    // Return empty array - caller will use localStorage fallback
    return [];
  }
}

// Get interests sent by a talent
export async function getSentInterests(talentId, params = {}) {
  const queryString = buildQueryString(params);
  const data = await apiRequest(`/interests/sent/${talentId}${queryString}`, {
    method: "GET",
  });
  return data.interests || data.items || [];
}

// Update interest status (accept/reject)
export async function updateInterestStatus(interestId, status, response) {
  const data = await apiRequest(`/interests/${interestId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, response }),
  });
  return data.interest;
}

// Add message to interest conversation
export async function addInterestMessage(interestId, message) {
  const data = await apiRequest(`/interests/${interestId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return data.interest;
}

// Mark interest as onboarded (after compensation setup)
export async function markInterestAsOnboarded(interestId) {
  return apiRequest(`/interests/${interestId}/onboard`, {
    method: "POST",
  });
}

// ==========================================
// INVITATIONS (Founder -> Talent)
// ==========================================

// Send invitation (Founder inviting talent)
export async function sendInvitation(invitation) {
  return apiRequest("/invitations/send", {
    method: "POST",
    body: JSON.stringify({ invitation }),
  });
}

// Get invitations sent by a founder
export async function getSentInvitations(founderId, params = {}) {
  const queryString = buildQueryString(params);
  const data = await apiRequest(`/invitations/sent/${founderId}${queryString}`, {
    method: "GET",
  });
  return data.invitations || data.items || [];
}

// Get invitations received by a talent
export async function getReceivedInvitations(talentId, params = {}) {
  const queryString = buildQueryString(params);
  const data = await apiRequest(
    `/invitations/received/${talentId}${queryString}`,
    {
      method: "GET",
    },
  );
  return data.invitations || data.items || [];
}

// Update invitation status (accept/reject)
export async function updateInvitationStatus(invitationId, status, response) {
  const data = await apiRequest(`/invitations/${invitationId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, response }),
  });
  return data.invitation;
}

// Add message to invitation conversation
export async function addInvitationMessage(invitationId, message) {
  const data = await apiRequest(`/invitations/${invitationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return data.invitation;
}
