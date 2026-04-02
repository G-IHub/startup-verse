const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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

// ==========================================
// INTERESTS (Talent -> Founder)
// ==========================================

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

  const response = await fetch(`${BASE_URL}/invitations/founder/${founderId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      "Content-Type": "application/json",
    },
  });

  console.log("📡 [InboxAPI] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "❌ [InboxAPI] Failed to fetch organization invitations:",
      errorText,
    );
    throw new Error(`Failed to fetch organization invitations: ${errorText}`);
  }

  const result = await response.json();
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
  const response = await fetch(
    `${BASE_URL}/invitations/${invitationId}/respond`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: accept ? "accepted" : "rejected",
        founderId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to respond to invitation");
  }

  return response.json();
}

// Send interest (Talent expressing interest in a startup)
export async function sendInterest(interest) {
  const response = await fetch(`${BASE_URL}/interests/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    },
    body: JSON.stringify({ interest }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send interest");
  }

  return response.json();
}

// Get interests received by a founder
export async function getReceivedInterests(founderId, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${BASE_URL}/interests/received/${founderId}${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch received interests");
    }

    const data = await response.json();
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
  const response = await fetch(
    `${BASE_URL}/interests/sent/${talentId}${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sent interests");
  }

  const data = await response.json();
  return data.interests || data.items || [];
}

// Update interest status (accept/reject)
export async function updateInterestStatus(interestId, status, response) {
  const res = await fetch(`${BASE_URL}/interests/${interestId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    },
    body: JSON.stringify({ status, response }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update interest status");
  }

  const data = await res.json();
  return data.interest;
}

// Add message to interest conversation
export async function addInterestMessage(interestId, message) {
  const response = await fetch(`${BASE_URL}/interests/${interestId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add message");
  }

  const data = await response.json();
  return data.interest;
}

// Mark interest as onboarded (after compensation setup)
export async function markInterestAsOnboarded(interestId) {
  const response = await fetch(`${BASE_URL}/interests/${interestId}/onboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark interest as onboarded");
  }

  return response.json();
}

// ==========================================
// INVITATIONS (Founder -> Talent)
// ==========================================

// Send invitation (Founder inviting talent)
export async function sendInvitation(invitation) {
  const response = await fetch(`${BASE_URL}/invitations/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    },
    body: JSON.stringify({ invitation }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send invitation");
  }

  return response.json();
}

// Get invitations sent by a founder
export async function getSentInvitations(founderId, params = {}) {
  const queryString = buildQueryString(params);
  const response = await fetch(
    `${BASE_URL}/invitations/sent/${founderId}${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sent invitations");
  }

  const data = await response.json();
  return data.invitations || data.items || [];
}

// Get invitations received by a talent
export async function getReceivedInvitations(talentId, params = {}) {
  const queryString = buildQueryString(params);
  const response = await fetch(
    `${BASE_URL}/invitations/received/${talentId}${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch received invitations");
  }

  const data = await response.json();
  return data.invitations || data.items || [];
}

// Update invitation status (accept/reject)
export async function updateInvitationStatus(invitationId, status, response) {
  const res = await fetch(`${BASE_URL}/invitations/${invitationId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    },
    body: JSON.stringify({ status, response }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update invitation status");
  }

  const data = await res.json();
  return data.invitation;
}

// Add message to invitation conversation
export async function addInvitationMessage(invitationId, message) {
  const response = await fetch(
    `${BASE_URL}/invitations/${invitationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify({ message }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add message");
  }

  const data = await response.json();
  return data.invitation;
}
