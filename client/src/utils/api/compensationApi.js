import { API_BASE_URL } from "../../config/apiBase.js";

const BASE_URL = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

// Create compensation contract
export async function createCompensationContract(
  founderId,
  teamMemberId,
  startupId,
  compensationConfig,
) {
  try {
    const response = await fetch(`${BASE_URL}/compensation-contracts`, {
      method: "POST",
      ...defaultOptions,
      body: JSON.stringify({
        founderId,
        teamMemberId,
        startupId,
        compensationConfig,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create compensation contract");
    }

    console.log("✅ Compensation contract created");
    return data;
  } catch (error) {
    console.error("❌ Error creating compensation contract:", error);
    throw error;
  }
}

// Get compensation contract for a team member
export async function getCompensationContract(teamMemberId) {
  try {
    const response = await fetch(
      `${BASE_URL}/compensation-contracts/member/${teamMemberId}`,
      {
        method: "GET",
        ...defaultOptions,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, contract: null };
      }
      throw new Error(data.error || "Failed to fetch compensation contract");
    }

    return data;
  } catch (error) {
    console.error(
      "❌ Backend compensation contract fetch failed:",
      error.message,
    );
    console.log("ℹ️ No compensation contract available");
    return { success: true, contract: null };
  }
}

// Get compensation status (vesting progress, payment eligibility)
export async function getCompensationStatus(teamMemberId) {
  try {
    const response = await fetch(
      `${BASE_URL}/compensation-status/${teamMemberId}`,
      {
        method: "GET",
        ...defaultOptions,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, status: null, contract: null };
      }
      throw new Error(data.error || "Failed to fetch compensation status");
    }

    return data;
  } catch (error) {
    console.error(
      "❌ Backend compensation status fetch failed:",
      error.message,
    );
    console.log("ℹ️ No compensation status available");
    return { success: true, status: null, contract: null };
  }
}

// Get all compensation contracts for a startup (founder view)
export async function getStartupCompensationContracts(startupId) {
  try {
    const response = await fetch(
      `${BASE_URL}/compensation-contracts/startup/${startupId}`,
      {
        method: "GET",
        ...defaultOptions,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to fetch startup compensation contracts",
      );
    }

    return data;
  } catch (error) {
    console.error(
      "❌ Backend startup compensation fetch failed:",
      error.message,
    );
    console.log(
      "ℹ️ No startup compensation contracts available",
    );
    return { success: true, contracts: [] };
  }
}

/**
 * Unified onboarding: persists via `POST /interests/:interestId/onboard` only.
 * `compensationConfig` is accepted for UI compatibility; compensation contracts
 * are handled separately when those routes exist.
 */
export async function convertTalentToTeamMember(
  talentId,
  founderId,
  startupId,
  compensationConfig,
  interestId,
) {
  if (!interestId) {
    throw new Error(
      "interestId is required — use the canonical interest onboarding endpoint.",
    );
  }
  try {
    const response = await fetch(
      `${BASE_URL}/interests/${encodeURIComponent(interestId)}/onboard`,
      {
        method: "POST",
        ...defaultOptions,
        body: JSON.stringify({
          talentId,
          founderId,
          startupId,
          compensationConfig,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to onboard team member");
    }

    return data;
  } catch (error) {
    console.error("Error converting talent to team member:", error);
    throw error;
  }
}

// Get pending team members (team members without compensation)
export async function getPendingTeamMembers(startupId) {
  try {
    const response = await fetch(
      `${BASE_URL}/compensation/pending-members/${startupId}`,
      {
        method: "GET",
        ...defaultOptions,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch pending team members");
    }

    return data;
  } catch (error) {
    console.error("❌ Backend pending members fetch failed:", error.message);
    console.log("ℹ️ No pending members available");
    return { success: true, pendingMembers: [], total: 0 };
  }
}
