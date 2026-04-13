/**
 * Demo Data Generator for Organizations & Accelerators Feature
 *
 * Usage: Run generateOrganizationDemo() from browser console to create test data
 */

import {
  createOrganization,
  createCohort,
  createCohortInvitation,
  respondToInvitation,
  getAllOrganizations,
  getAllCohorts,
  getAllCohortInvitations,
} from "./organizationHelpers";
import {
  STORAGE_KEYS,
  persistCurrentUser,
  writeStoredList,
} from "../app/session";

export function generateOrganizationDemo() {
  console.log("🏗️  Generating Organization Demo Data...\n");

  // Get all existing users
  const allUsers = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
  );
  const founders = allUsers.filter((u) => u.role === "founder");

  if (founders.length === 0) {
    console.error("❌ No founders found! Create a founder account first.");
    return;
  }

  // Step 1: Create an organization admin user
  const orgAdminId = `user_org_${Date.now()}`;
  const orgAdmin = {
    id: orgAdminId,
    role: "organization-admin",
    name: "Sarah Chen",
    email: "sarah@hultprize.org",
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  };

  allUsers.push(orgAdmin);
  writeStoredList(STORAGE_KEYS.teamMembers, allUsers);
  persistCurrentUser(orgAdmin);

  console.log("✅ Created Organization Admin:", orgAdmin.name);
  console.log("   Email:", orgAdmin.email);
  console.log("   ID:", orgAdmin.id);
  console.log("");

  // Step 2: Create Organization
  const org = createOrganization(
    "Hult Prize Boston Regional",
    "competition",
    orgAdminId,
    "Social impact startup competition focusing on solving world challenges",
    "https://hultprize.org",
  );

  console.log("✅ Created Organization:", org.name);
  console.log("   Type:", org.type);
  console.log("   ID:", org.id);
  console.log("");

  // Step 3: Create Cohort
  const cohort = createCohort(
    org.id,
    "2026 Spring Cohort",
    orgAdminId,
    "First cohort of the 2026 season",
    "2026-01-15",
    "2026-05-15",
  );

  console.log("✅ Created Cohort:", cohort.name);
  console.log("   Dates:", cohort.startDate, "to", cohort.endDate);
  console.log("   ID:", cohort.id);
  console.log("");

  // Step 4: Send invitations to founders
  const maxInvitations = Math.min(founders.length, 5); // Invite up to 5 founders
  console.log(`📧 Sending ${maxInvitations} invitations...\n`);

  for (let i = 0; i < maxInvitations; i++) {
    const founder = founders[i];
    const invitation = createCohortInvitation(
      cohort.id,
      org.id,
      founder.id,
      founder.email,
      founder.name,
      founder.startupName || founder.companyName || "Unnamed Startup",
      orgAdminId,
      `We're excited to invite ${founder.startupName || "your startup"} to join our 2026 Spring Cohort! This program will provide mentorship, resources, and visibility to help you scale your social impact.`,
    );

    console.log(
      `   ✉️  Invited: ${founder.name} (${founder.startupName || "Unnamed Startup"})`,
    );

    // Auto-accept the first invitation for demo purposes
    if (i === 0) {
      respondToInvitation(invitation.id, true);
      console.log(`   ✅ Auto-accepted invitation for demo`);
    }
  }

  console.log("");
  console.log("════════════════════════════════════════════════════");
  console.log("✨ DEMO DATA GENERATED SUCCESSFULLY! ✨");
  console.log("════════════════════════════════════════════════════");
  console.log("");
  console.log("📋 What was created:");
  console.log("   • 1 Organization Admin account");
  console.log("   • 1 Organization (Hult Prize Boston Regional)");
  console.log("   • 1 Cohort (2026 Spring Cohort)");
  console.log(`   • ${maxInvitations} Invitations sent to founders`);
  console.log(`   • 1 Auto-accepted invitation (for demo)`);
  console.log("");
  console.log("🔄 NEXT STEPS:");
  console.log("   1. Reload the page to see Organization Dashboard");
  console.log("   2. Switch to a founder account to see invitation");
  console.log("   3. Accept invitation to join cohort");
  console.log("   4. Switch back to org admin to see startup in cohort");
  console.log("");
  console.log("🧪 TEST ACCOUNTS:");
  console.log(`   Org Admin: ${orgAdmin.email}`);
  if (founders.length > 0) {
    console.log(`   Founder (with invitation): ${founders[0].email}`);
  }
  console.log("");
  console.log("════════════════════════════════════════════════════");

  return {
    orgAdmin,
    organization: org,
    cohort,
    invitationsSent: maxInvitations,
  };
}

export function clearOrganizationDemo() {
  localStorage.removeItem("startupverse_organizations");
  localStorage.removeItem("startupverse_org_members");
  localStorage.removeItem("startupverse_cohorts");
  localStorage.removeItem("startupverse_cohort_invitations");
  localStorage.removeItem("startupverse_cohort_memberships");

  console.log("✅ Cleared all organization demo data");
}

export function showOrganizationData() {
  console.log("═══════════════════════════════════════");
  console.log("📊 CURRENT ORGANIZATION DATA");
  console.log("═══════════════════════════════════════");
  console.log("");

  const orgs = getAllOrganizations();
  console.log(`🏢 Organizations (${orgs.length}):`);
  orgs.forEach((org) => {
    console.log(`   • ${org.name} (${org.type})`);
  });
  console.log("");

  const cohorts = getAllCohorts();
  console.log(`👥 Cohorts (${cohorts.length}):`);
  cohorts.forEach((cohort) => {
    console.log(`   • ${cohort.name}`);
  });
  console.log("");

  const invitations = getAllCohortInvitations();
  console.log(`📧 Invitations (${invitations.length}):`);
  invitations.forEach((inv) => {
    console.log(`   • ${inv.startupName} - ${inv.status}`);
  });
  console.log("");
  console.log("═══════════════════════════════════════");
}

// Expose to window for easy console access
if (typeof window !== "undefined") {
  window.generateOrganizationDemo = generateOrganizationDemo;
  window.clearOrganizationDemo = clearOrganizationDemo;
  window.showOrganizationData = showOrganizationData;
}

export default {
  generateOrganizationDemo,
  clearOrganizationDemo,
  showOrganizationData,
};
