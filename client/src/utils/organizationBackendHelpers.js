/**
 * Organization helpers — HTTP API only.
 *
 * All organization operations use the Express/MongoDB backend via `organizationApi`.
 */

import * as orgApi from "./api/organizationApi";

console.log("🏢 Organization System: BACKEND MODE");
console.log("📡 Organization data via REST API");

// ==========================================
// ORGANIZATION MANAGEMENT
// ==========================================

export async function createOrganization(
  name,
  type,
  creatorId,
  creatorEmail,
  creatorName,
  description,
  website,
  logo,
) {
  console.log("📤 Creating organization via API...", { name, type });

  try {
    const organization = await orgApi.createOrganization({
      name,
      type,
      description,
      website,
      logo,
      creatorId,
      creatorEmail,
      creatorName,
    });

    console.log("✅ Organization created:", organization.id);
    return organization;
  } catch (error) {
    console.error("❌ Failed to create organization:", error);
    throw error;
  }
}

export async function getUserOrganizations(userId) {
  console.log("📤 Fetching organizations from API for user:", userId);

  try {
    const organizations = await orgApi.getUserOrganizations(userId);
    console.log(`✅ Found ${organizations.length} organizations`);
    return organizations;
  } catch (error) {
    console.error("❌ Failed to fetch organizations:", error);
    throw error;
  }
}

export async function getOrganization(orgId) {
  console.log("📤 Fetching organization from API:", orgId);

  try {
    const organization = await orgApi.getOrganization(orgId);
    return organization;
  } catch (error) {
    console.error("❌ Failed to fetch organization:", error);
    return null;
  }
}

// Helper function for backward compatibility
export function getAllOrganizations() {
  console.warn(
    "⚠️ getAllOrganizations() is deprecated - use getUserOrganizations() instead",
  );
  return [];
}

export function getOrganizationMembers(userId) {
  console.warn("⚠️ getOrganizationMembers() is not yet implemented in backend");
  return [];
}

export function getOrganizationMembersByOrg(organizationId) {
  console.warn(
    "⚠️ getOrganizationMembersByOrg() is not yet implemented in backend",
  );
  return [];
}

export async function isOrganizationAdmin(userId, organizationId) {
  console.log("📤 Checking organization admin status via API...", {
    userId,
    organizationId,
  });

  try {
    const isAdmin = await orgApi.isOrganizationAdmin(organizationId, userId);
    console.log(`✅ Admin check result: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error("❌ Failed to check admin status:", error);
    // Return false on error to be safe
    return false;
  }
}

// ==========================================
// COHORT MANAGEMENT
// ==========================================

export async function createCohort(
  name,
  organizationId,
  creatorId,
  creatorEmail,
  creatorName,
  description,
  startDate,
  endDate,
) {
  console.log("📤 Creating cohort via API...", { name, organizationId });

  try {
    const cohort = await orgApi.createCohort({
      name,
      organizationId,
      description,
      startDate,
      endDate,
      creatorId,
      creatorEmail,
      creatorName,
    });

    console.log("✅ Cohort created:", cohort.id);
    return cohort;
  } catch (error) {
    console.error("❌ Failed to create cohort:", error);
    throw error;
  }
}

export async function getOrganizationCohorts(orgId) {
  console.log("📤 Fetching cohorts from API for org:", orgId);

  try {
    const cohorts = await orgApi.getOrganizationCohorts(orgId);
    console.log(`✅ Found ${cohorts.length} cohorts`);
    return cohorts;
  } catch (error) {
    console.error("❌ Failed to fetch cohorts:", error);
    return [];
  }
}

export async function deleteCohort(cohortId, userId) {
  console.log("📤 Deleting cohort via API...", { cohortId, userId });

  try {
    await orgApi.deleteCohort(cohortId, userId);
    console.log("✅ Cohort deleted:", cohortId);
  } catch (error) {
    console.error("❌ Failed to delete cohort:", error);
    throw error;
  }
}

export async function getCohort(cohortId) {
  console.log("📤 Fetching cohort from API:", cohortId);

  try {
    const cohort = await orgApi.getCohort(cohortId);
    return cohort;
  } catch (error) {
    // Silently handle 404 errors - cohort might have been deleted
    if (error.message && error.message.includes("404")) {
      console.log(`⏭️ Cohort ${cohortId} not found (404)`);
      return null;
    }
    console.error("❌ Failed to fetch cohort:", error);
    return null;
  }
}

// Helper function for backward compatibility
export function getAllCohorts() {
  console.warn(
    "⚠️ getAllCohorts() is deprecated - use getOrganizationCohorts() instead",
  );
  return [];
}

export function updateCohortStats(cohortId) {
  console.warn("⚠️ updateCohortStats() is not yet implemented in backend");
  // Stats are calculated on the backend when fetching cohort members
}

// ==========================================
// INVITATION MANAGEMENT
// ==========================================

export async function createInvitation(
  cohortId,
  organizationId,
  founderId,
  founderEmail,
  founderName,
  startupName,
  invitedBy,
  message,
) {
  console.log("📤 Creating invitation via API...", {
    founderEmail,
    cohortId,
  });

  try {
    const invitation = await orgApi.createInvitation({
      cohortId,
      organizationId,
      founderId,
      founderEmail,
      founderName,
      startupName,
      invitedBy,
      message,
    });

    console.log("✅ Invitation created:", invitation.id);
    return invitation;
  } catch (error) {
    console.error("❌ Failed to create invitation:", error);
    throw error;
  }
}

export async function getFounderInvitations(founderId) {
  console.log("📤 Fetching invitations from API for founder:", founderId);

  try {
    const invitations = await orgApi.getFounderInvitations(founderId);
    console.log(`✅ Found ${invitations.length} invitations`);
    return invitations;
  } catch (error) {
    console.error("❌ Failed to fetch invitations:", error);
    // Return empty array on error to avoid breaking the UI
    return [];
  }
}

export async function respondToInvitation(invitationId, founderId, status) {
  console.log("📤 Responding to invitation via API...", {
    invitationId,
    status,
  });

  try {
    const invitation = await orgApi.respondToInvitation(
      invitationId,
      founderId,
      status,
    );
    console.log("✅ Invitation response recorded");
    return invitation;
  } catch (error) {
    console.error("❌ Failed to respond to invitation:", error);
    throw error;
  }
}

// Helper functions for backward compatibility
export function getAllCohortInvitations() {
  console.warn("⚠️ getAllCohortInvitations() is deprecated");
  return [];
}

export function getCohortInvitations(cohortId) {
  console.warn(
    "⚠️ getCohortInvitations() is deprecated - invitations are fetched per founder",
  );
  return [];
}

export async function createCohortInvitation(
  cohortId,
  organizationId,
  startupId,
  founderEmail,
  founderName,
  startupName,
  sentBy,
  message,
) {
  return createInvitation(
    cohortId,
    organizationId,
    startupId,
    founderEmail,
    founderName,
    startupName,
    sentBy,
    message,
  );
}

// ==========================================
// COHORT MEMBERSHIP
// ==========================================

export async function getCohortMembers(cohortId) {
  console.log("📤 Fetching cohort members from API:", cohortId);

  try {
    const members = await orgApi.getCohortMembers(cohortId);
    console.log(`✅ Found ${members.length} cohort members`);
    return members;
  } catch (error) {
    console.error("❌ Failed to fetch cohort members:", error);
    return [];
  }
}

export async function getStartupSnapshot(founderId) {
  console.log("📤 Fetching startup snapshot from API:", founderId);

  try {
    const snapshot = await orgApi.getStartupSnapshot(founderId);
    console.log("✅ Startup snapshot retrieved");
    return snapshot;
  } catch (error) {
    console.error("❌ Failed to fetch startup snapshot:", error);
    return null;
  }
}

// Helper functions for backward compatibility
export function getAllCohortMemberships() {
  console.warn("⚠️ getAllCohortMemberships() is deprecated");
  return [];
}

export function getCohortMemberships(cohortId) {
  console.warn(
    "⚠️ getCohortMemberships() is deprecated - use getCohortMembers() instead",
  );
  return [];
}

export async function getStartupMemberships(startupId) {
  console.log("📥 Fetching startup memberships from backend...", { startupId });

  try {
    const response = await orgApi.getFounderMemberships(startupId);

    if (response.success && response.memberships) {
      console.log(
        "✅ Loaded startup memberships:",
        response.memberships.length,
      );

      // Transform backend format to frontend format
      return response.memberships.map((membership) => ({
        id: membership.id,
        cohortId: membership.cohortId,
        organizationId: membership.organizationId,
        startupId: membership.founderId,
        startupName: membership.startupName,
        founderEmail: membership.founderEmail,
        founderName: membership.founderName,
        joinedAt: membership.joinedAt,
        leftAt: membership.leftAt,
        cohort: membership.cohort,
        organization: membership.organization,
      }));
    }

    console.warn("⚠️ Failed to load memberships:", response);
    return [];
  } catch (error) {
    console.error("❌ Error loading startup memberships:", error);
    return [];
  }
}

export function createCohortMembership(
  cohortId,
  organizationId,
  startupId,
  invitationId,
) {
  console.warn(
    "⚠️ createCohortMembership() is handled automatically when accepting invitations",
  );
  return {
    id: "",
    cohortId,
    organizationId,
    founderId: startupId,
    founderEmail: "",
    founderName: "",
    startupName: "",
    joinedAt: new Date().toISOString(),
    leftAt: null,
  };
}

// ==========================================
// USER SEARCH
// ==========================================

export async function searchUserByEmail(email) {
  console.log(`🔍 Searching for founder via API: ${email}`);

  try {
    const user = await orgApi.searchUserByEmail(email);

    if (user) {
      console.log(`✅ Found user:`, user);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        startupName: user.startup_name,
        companyName: user.company_name,
        onboardingComplete: user.onboarding_complete,
        createdAt: new Date().toISOString(),
      };
    }

    console.log(`⚠️ User not found`);
    return null;
  } catch (error) {
    console.error("❌ Failed to search user:", error);
    return null;
  }
}

// ==========================================
// EXPORT / REPORTING (Deprecated - moved to backend)
// ==========================================

export async function generateCohortExport(cohortId) {
  console.warn(
    "⚠️ generateCohortExport() should be implemented as backend route",
  );

  try {
    const cohort = await getCohort(cohortId);
    const members = await getCohortMembers(cohortId);
    const organization = cohort
      ? await getOrganization(cohort.organizationId)
      : null;

    if (!cohort || !organization) return null;

    return {
      cohort: {
        name: cohort.name,
        organization: organization.name,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        exportedAt: new Date().toISOString(),
      },
      startups: members.map((member) => ({
        name: member.startupName,
        founder: member.founderName,
        stage: "N/A",
        teamSize: member.progress?.teamSize || 1,
        status: member.progress?.activityStatus || "unknown",
        lastActivity: member.progress?.lastActive || "Never",
        weeklyStreak: member.progress?.weeklyOutcomeStreak || 0,
      })),
    };
  } catch (error) {
    console.error("❌ Failed to generate cohort export:", error);
    return null;
  }
}

export function exportToCSV(data) {
  const header =
    "Startup Name,Founder,Stage,Team Size,Status,Last Activity,Weekly Streak\n";
  const rows = data.startups
    .map(
      (s) =>
        `"${s.name}","${s.founder}","${s.stage}",${s.teamSize},"${s.status}","${s.lastActivity}",${s.weeklyStreak}`,
    )
    .join("\n");

  return header + rows;
}

export function downloadCSV(data, filename) {
  const csv = exportToCSV(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ==========================================
// ACTIVITY STATUS (Calculated on backend)
// ==========================================

export function calculateStartupStatus(startupId, organizationId) {
  console.warn("⚠️ calculateStartupStatus() is now calculated on the backend");
  return "active";
}

// ==========================================
// DEBUGGING HELPERS
// ==========================================

/**
 * Debug helper: Check invitations for a specific founder by email
 * Usage in console: await window.checkFounderInvitations('seyimba1234@gmail.com')
 */
export async function debugCheckFounderInvitations(founderEmail) {
  console.log("🔍 DEBUG: Checking invitations for founder:", founderEmail);

  try {
    // First, search for the user by email to get their ID
    const user = await searchUserByEmail(founderEmail);

    if (!user) {
      console.error("❌ User not found with email:", founderEmail);
      console.log("💡 Make sure the founder has signed up first!");
      return;
    }

    console.log("✅ Found user:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      startup: user.startupName || user.companyName,
    });

    // Now fetch their invitations
    const invitations = await getFounderInvitations(user.id);

    console.log(`\n📬 Total invitations: ${invitations.length}`);

    if (invitations.length === 0) {
      console.log("⚠️ No invitations found for this founder");
      console.log("💡 Possible reasons:");
      console.log("   1. No invitations have been sent yet");
      console.log(
        "   2. The founderId used when creating invitation doesn't match",
      );
      return;
    }

    invitations.forEach((inv, index) => {
      console.log(`\n📨 Invitation ${index + 1}:`, {
        id: inv.id,
        status: inv.status,
        cohortId: inv.cohortId,
        organizationId: inv.organizationId,
        message: inv.message,
        createdAt: inv.createdAt,
        respondedAt: inv.respondedAt,
      });
    });

    const pending = invitations.filter((inv) => inv.status === "pending");
    console.log(`\n⏳ Pending invitations: ${pending.length}`);
  } catch (error) {
    console.error("❌ Error checking invitations:", error);
  }
}

// Make it available on window for debugging
if (typeof window !== "undefined") {
  window.checkFounderInvitations = debugCheckFounderInvitations;
}
