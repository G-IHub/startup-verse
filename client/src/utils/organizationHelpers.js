/**
 * Organization & Cohort Management Utilities
 *
 * v0.1 - localStorage-based (will migrate to backend later)
 */

const ORGS_KEY = "startupverse_organizations";
const ORG_MEMBERS_KEY = "startupverse_org_members";
const COHORTS_KEY = "startupverse_cohorts";
const COHORT_INVITATIONS_KEY = "startupverse_cohort_invitations";
const COHORT_MEMBERSHIPS_KEY = "startupverse_cohort_memberships";

// ==========================================
// ORGANIZATION MANAGEMENT
// ==========================================

export function createOrganization(
  name,
  type,
  createdBy,
  description,
  website,
) {
  const orgs = getAllOrganizations();

  const newOrg = {
    id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    description,
    website,
    createdAt: new Date().toISOString(),
    createdBy,
    settings: {
      activityThresholds: {
        activeWithinDays: 7,
        slowingWithinDays: 14,
        stalledAfterDays: 14,
      },
    },
  };

  orgs.push(newOrg);
  localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));

  // Automatically add creator as admin
  addOrganizationMember(newOrg.id, createdBy, "admin", createdBy);

  return newOrg;
}

export function getAllOrganizations() {
  const stored = localStorage.getItem(ORGS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getOrganization(orgId) {
  const orgs = getAllOrganizations();
  return orgs.find((o) => o.id === orgId) || null;
}

export function getUserOrganizations(userId) {
  const members = getOrganizationMembers(userId);
  const orgs = getAllOrganizations();

  const userOrgIds = members.map((m) => m.organizationId);
  return orgs.filter((o) => userOrgIds.includes(o.id));
}

// ==========================================
// ORGANIZATION MEMBERS
// ==========================================

export function addOrganizationMember(organizationId, userId, role, addedBy) {
  const members = getAllOrganizationMembers();

  const newMember = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    organizationId,
    userId,
    role,
    addedAt: new Date().toISOString(),
    addedBy,
  };

  members.push(newMember);
  localStorage.setItem(ORG_MEMBERS_KEY, JSON.stringify(members));

  return newMember;
}

export function getAllOrganizationMembers() {
  const stored = localStorage.getItem(ORG_MEMBERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getOrganizationMembers(userId) {
  const members = getAllOrganizationMembers();
  return members.filter((m) => m.userId === userId);
}

export function getOrganizationMembersByOrg(organizationId) {
  const members = getAllOrganizationMembers();
  return members.filter((m) => m.organizationId === organizationId);
}

export function isOrganizationAdmin(userId, organizationId) {
  const members = getAllOrganizationMembers();
  const member = members.find(
    (m) => m.userId === userId && m.organizationId === organizationId,
  );
  return member?.role === "admin";
}

// ==========================================
// COHORT MANAGEMENT
// ==========================================

export function createCohort(
  organizationId,
  name,
  createdBy,
  description,
  startDate,
  endDate,
) {
  const cohorts = getAllCohorts();

  const newCohort = {
    id: `cohort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    organizationId,
    name,
    description,
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  cohorts.push(newCohort);
  localStorage.setItem(COHORTS_KEY, JSON.stringify(cohorts));

  return newCohort;
}

export function getAllCohorts() {
  const stored = localStorage.getItem(COHORTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function getCohort(cohortId) {
  const cohorts = getAllCohorts();
  return cohorts.find((c) => c.id === cohortId) || null;
}

export function getOrganizationCohorts(organizationId) {
  const cohorts = getAllCohorts();
  return cohorts.filter((c) => c.organizationId === organizationId);
}

export function updateCohortStats(cohortId) {
  const cohorts = getAllCohorts();
  const cohort = cohorts.find((c) => c.id === cohortId);

  if (!cohort) return;

  const memberships = getCohortMemberships(cohortId);
  const startups = memberships.map((m) => getStartupSnapshot(m.startupId));

  cohort.stats = {
    totalStartups: startups.length,
    activeStartups: startups.filter((s) => s?.status === "active").length,
    slowingStartups: startups.filter((s) => s?.status === "slowing").length,
    stalledStartups: startups.filter((s) => s?.status === "stalled").length,
  };

  localStorage.setItem(COHORTS_KEY, JSON.stringify(cohorts));
}

// ==========================================
// COHORT INVITATIONS
// ==========================================

export function createCohortInvitation(
  cohortId,
  organizationId,
  startupId,
  founderEmail,
  founderName,
  startupName,
  sentBy,
  message,
) {
  const invitations = getAllCohortInvitations();

  const newInvitation = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    cohortId,
    organizationId,
    startupId,
    founderEmail,
    founderName,
    startupName,
    status: "pending",
    message,
    sentAt: new Date().toISOString(),
    sentBy,
  };

  invitations.push(newInvitation);
  localStorage.setItem(COHORT_INVITATIONS_KEY, JSON.stringify(invitations));

  return newInvitation;
}

export function getAllCohortInvitations() {
  const stored = localStorage.getItem(COHORT_INVITATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getFounderInvitations(founderId) {
  const invitations = getAllCohortInvitations();
  return invitations.filter(
    (inv) => inv.startupId === founderId && inv.status === "pending",
  );
}

export function getCohortInvitations(cohortId) {
  const invitations = getAllCohortInvitations();
  return invitations.filter((inv) => inv.cohortId === cohortId);
}

export function respondToInvitation(invitationId, accept) {
  const invitations = getAllCohortInvitations();
  const invitation = invitations.find((inv) => inv.id === invitationId);

  if (!invitation || invitation.status !== "pending") {
    return null;
  }

  invitation.status = accept ? "accepted" : "declined";
  invitation.respondedAt = new Date().toISOString();

  localStorage.setItem(COHORT_INVITATIONS_KEY, JSON.stringify(invitations));

  // If accepted, create membership
  if (accept) {
    createCohortMembership(
      invitation.cohortId,
      invitation.organizationId,
      invitation.startupId,
      invitation.id,
    );

    // Update cohort stats
    updateCohortStats(invitation.cohortId);
  }

  return invitation;
}

/**
 * Alias for createCohortInvitation with frontend-friendly signature
 */
export function createInvitation(
  cohortId,
  organizationId,
  founderId,
  founderEmail,
  founderName,
  startupName,
  sentBy,
  message,
) {
  return createCohortInvitation(
    cohortId,
    organizationId,
    founderId,
    founderEmail,
    founderName,
    startupName,
    sentBy,
    message,
  );
}

// ==========================================
// COHORT MEMBERSHIPS
// ==========================================

export function createCohortMembership(
  cohortId,
  organizationId,
  startupId,
  invitationId,
) {
  const memberships = getAllCohortMemberships();

  const newMembership = {
    id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    cohortId,
    organizationId,
    startupId,
    joinedAt: new Date().toISOString(),
    invitationId,
  };

  memberships.push(newMembership);
  localStorage.setItem(COHORT_MEMBERSHIPS_KEY, JSON.stringify(memberships));

  return newMembership;
}

export function getAllCohortMemberships() {
  const stored = localStorage.getItem(COHORT_MEMBERSHIPS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getCohortMemberships(cohortId) {
  const memberships = getAllCohortMemberships();
  return memberships.filter((m) => m.cohortId === cohortId);
}

export function getStartupMemberships(startupId) {
  const memberships = getAllCohortMemberships();
  return memberships.filter((m) => m.startupId === startupId);
}

/**
 * Get cohort members with enriched founder and progress data
 */
export async function getCohortMembers(cohortId) {
  const memberships = getCohortMemberships(cohortId);

  return memberships.map((membership) => {
    const snapshot = getStartupSnapshot(membership.startupId);

    if (!snapshot) {
      return {
        ...membership,
        founderId: membership.startupId,
        founderName: "Unknown",
        founderEmail: "unknown@example.com",
        startupName: "Unknown Startup",
        joinedAt: membership.joinedAt,
        leftAt: null,
        founder: {
          id: membership.startupId,
          name: "Unknown",
          email: "unknown@example.com",
          startupName: "Unknown Startup",
        },
        progress: {
          weeklyOutcomeStreak: 0,
          currentMilestone: null,
          completedMilestones: 0,
          tasksCompletedThisWeek: 0,
          activityStatus: "stalled",
          lastActive: null,
        },
      };
    }

    return {
      ...membership,
      founderId: snapshot.startupId,
      founderName: snapshot.founderName,
      founderEmail: "", // Not in snapshot
      startupName: snapshot.startupName,
      joinedAt: membership.joinedAt,
      leftAt: null,
      founder: {
        id: snapshot.startupId,
        name: snapshot.founderName,
        email: "",
        avatar: undefined,
        startupName: snapshot.startupName,
      },
      progress: {
        weeklyOutcomeStreak: snapshot.executionSummary.weeklyStreak,
        currentMilestone:
          snapshot.executionSummary.currentOutcome?.title || null,
        completedMilestones:
          snapshot.executionSummary.currentOutcome?.milestonesComplete || 0,
        tasksCompletedThisWeek: snapshot.activitySummary.completedTasks || 0,
        activityStatus: snapshot.status,
        lastActive:
          snapshot.activitySummary.lastActivityAt || membership.joinedAt,
      },
    };
  });
}

// ==========================================
// ACTIVITY STATUS CALCULATION
// ==========================================

export function calculateStartupStatus(startupId, organizationId) {
  // Get organization settings or use defaults
  const org = organizationId ? getOrganization(organizationId) : null;
  const thresholds = org?.settings?.activityThresholds || {
    activeWithinDays: 7,
    slowingWithinDays: 14,
    stalledAfterDays: 14,
  };

  // Get execution data
  const EXECUTION_DATA_KEY = "startupverse_execution";
  const stored = localStorage.getItem(`${EXECUTION_DATA_KEY}_${startupId}`);

  if (!stored) {
    return "stalled"; // No execution data at all
  }

  const executionData = JSON.parse(stored);
  const now = new Date();

  // Check last activity
  let lastActivityDate = null;

  // Check current outcome activity
  if (executionData.currentOutcome?.milestones) {
    for (const milestone of executionData.currentOutcome.milestones) {
      if (milestone.tasks) {
        for (const task of milestone.tasks) {
          if (task.completedAt) {
            const taskDate = new Date(task.completedAt);
            if (!lastActivityDate || taskDate > lastActivityDate) {
              lastActivityDate = taskDate;
            }
          }
        }
      }
    }
  }

  // Check week history
  if (executionData.weekHistory?.length > 0) {
    const lastWeek =
      executionData.weekHistory[executionData.weekHistory.length - 1];
    if (lastWeek.completedAt) {
      const weekDate = new Date(lastWeek.completedAt);
      if (!lastActivityDate || weekDate > lastActivityDate) {
        lastActivityDate = weekDate;
      }
    }
  }

  if (!lastActivityDate) {
    return "stalled";
  }

  const daysSinceActivity = Math.floor(
    (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Check contributor balance
  const contributorBalance = calculateContributorBalance(startupId);
  const singleContributorDominating = !contributorBalance.isBalanced;

  // Determine status
  if (
    daysSinceActivity <= thresholds.activeWithinDays &&
    !singleContributorDominating
  ) {
    return "active";
  } else if (
    daysSinceActivity <= thresholds.slowingWithinDays ||
    singleContributorDominating
  ) {
    return "slowing";
  } else {
    return "stalled";
  }
}

// ==========================================
// STARTUP SNAPSHOT
// ==========================================

export function getStartupSnapshot(startupId) {
  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );
  const founder = allUsers.find(
    (u) => u.id === startupId && u.role === "founder",
  );

  if (!founder) return null;

  // Get team members
  const teamMembers = allUsers.filter(
    (u) => u.startupId === startupId && u.role === "team-member",
  );

  // Get execution data
  const EXECUTION_DATA_KEY = "startupverse_execution";
  const executionStored = localStorage.getItem(
    `${EXECUTION_DATA_KEY}_${startupId}`,
  );
  const executionData = executionStored ? JSON.parse(executionStored) : null;

  // Get journey progress for stage
  const JOURNEY_KEY = "startupverse_journey_progress";
  const journeyStored = localStorage.getItem(`${JOURNEY_KEY}_${startupId}`);
  const journeyData = journeyStored ? JSON.parse(journeyStored) : null;

  const currentStage = journeyData?.currentStage || 1;
  const stageName = getStageNameFromId(currentStage);

  // Calculate activity summary (last 30 days)
  const activitySummary = calculateActivitySummary(startupId);

  // Get contribution balance
  const contributionBalance = calculateContributorBalance(startupId);

  // Build snapshot
  const snapshot = {
    startupId,
    startupName:
      founder.startupName || founder.companyName || "Unnamed Startup",
    founderName: founder.name,
    currentStage,
    stageName,
    teamSize: teamMembers.length + 1, // +1 for founder
    teamMembers: [
      {
        id: founder.id,
        name: founder.name,
        role: "Founder",
        joinedAt: founder.createdAt,
      },
      ...teamMembers.map((tm) => ({
        id: tm.id,
        name: tm.name,
        role: tm.professionalTitle || "Team Member",
        joinedAt: tm.createdAt,
      })),
    ],

    activitySummary,
    executionSummary: {
      currentWeek: (executionData?.weekHistory?.length || 0) + 1,
      weeklyStreak: executionData?.streak || 0,
      currentOutcome: executionData?.currentOutcome
        ? {
            title: executionData.currentOutcome.title,
            progress: calculateOutcomeProgress(executionData.currentOutcome),
            milestonesComplete:
              executionData.currentOutcome.milestones?.filter(
                (m) => m.tasksCompleted === m.totalTasks,
              ).length || 0,
            milestonesTotal:
              executionData.currentOutcome.milestones?.length || 0,
          }
        : undefined,
    },
    contributionBalance,
    status: calculateStartupStatus(startupId),
  };

  return snapshot;
}

function getStageNameFromId(stageId) {
  const stages = {
    1: "Idea & Validation",
    2: "Company Formation",
    3: "Team Building",
    4: "Product Development",
    5: "Go-to-Market",
    6: "Operations & Scaling",
  };
  return stages[stageId] || "Unknown";
}

function calculateActivitySummary(startupId) {
  // This is a simplified version - will be enhanced later
  const EXECUTION_DATA_KEY = "startupverse_execution";
  const stored = localStorage.getItem(`${EXECUTION_DATA_KEY}_${startupId}`);

  if (!stored) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      activeDays: 0,
    };
  }

  const executionData = JSON.parse(stored);
  let totalTasks = 0;
  let completedTasks = 0;

  if (executionData.currentOutcome?.milestones) {
    for (const milestone of executionData.currentOutcome.milestones) {
      totalTasks += milestone.totalTasks || 0;
      completedTasks += milestone.tasksCompleted || 0;
    }
  }

  return {
    totalTasks,
    completedTasks,
    activeDays: 0, // Will calculate properly later
    lastActivityAt: executionData.currentOutcome?.updatedAt,
  };
}

function calculateOutcomeProgress(outcome) {
  if (!outcome.milestones || outcome.milestones.length === 0) return 0;

  let totalTasks = 0;
  let completedTasks = 0;

  for (const milestone of outcome.milestones) {
    totalTasks += milestone.totalTasks || 0;
    completedTasks += milestone.tasksCompleted || 0;
  }

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function calculateContributorBalance(startupId) {
  // Simplified version - will enhance later with actual task data
  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );
  const teamMembers = allUsers.filter(
    (u) =>
      (u.id === startupId || u.startupId === startupId) &&
      (u.role === "founder" || u.role === "team-member"),
  );

  if (teamMembers.length === 0) {
    return {
      topContributor: { name: "No team", percentage: 0 },
      isBalanced: true,
    };
  }

  // For now, assume balanced if more than 1 team member
  // Later: calculate from actual task completion data
  if (teamMembers.length === 1) {
    return {
      topContributor: { name: teamMembers[0].name, percentage: 100 },
      isBalanced: false,
    };
  }

  return {
    topContributor: { name: teamMembers[0].name, percentage: 50 },
    isBalanced: true,
  };
}

// ==========================================
// EXPORT / REPORTING
// ==========================================

export async function generateCohortExport(cohortId) {
  const cohort = await getCohort(cohortId);
  if (!cohort) return null;

  const org = getOrganization(cohort.organizationId);
  if (!org) return null;

  const memberships = getCohortMemberships(cohortId);
  const startups = memberships
    .map((m) => getStartupSnapshot(m.startupId))
    .filter((s) => s !== null);

  return {
    cohort: {
      name: cohort.name,
      organization: org.name,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      exportedAt: new Date().toISOString(),
    },
    startups: startups.map((s) => ({
      name: s.startupName,
      founder: s.founderName,
      stage: s.stageName,
      teamSize: s.teamSize,
      status: s.status,
      lastActivity: s.activitySummary.lastActivityAt || "Never",
      weeklyStreak: s.executionSummary.weeklyStreak,
    })),
  };
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
// USER SEARCH
// ==========================================

/**
 * Search for a user by email (localStorage version)
 */
export async function searchUserByEmail(email) {
  // Get all users from localStorage
  const USERS_KEY = "startupverse_users";
  const stored = localStorage.getItem(USERS_KEY);

  if (!stored) {
    return null;
  }

  const users = JSON.parse(stored);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  return user || null;
}
