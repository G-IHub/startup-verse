/**
 * Admin Analytics Utilities - FIXED VERSION
 *
 * Prefers server snapshot (MongoDB) when the admin is authenticated; falls
 * back to legacy localStorage aggregation.
 */

import { STORAGE_KEYS } from "../app/session";
import { API_BASE_URL } from "../config/apiBase.js";

let serverSnapshotPromise = null;

async function fetchServerSnapshot() {
  try {
    const r = await fetch(`${API_BASE_URL}/admin/analytics/snapshot`, {
      credentials: "include",
    });
    if (!r.ok) return null;
    const p = await r.json();
    return p.success && p.data ? p.data : null;
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  if (!serverSnapshotPromise) {
    serverSnapshotPromise = fetchServerSnapshot();
  }
  return serverSnapshotPromise;
}

function mapSnapshotToPlatformAnalytics(snap) {
  const { stats, startups } = snap;
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
  const oneMonthAgo = new Date(Date.now() - 30 * 86400000);
  const users = snap.users || [];
  const newThisWeek = users.filter(
    (u) => u.createdAt && new Date(u.createdAt) > oneWeekAgo,
  ).length;
  const newThisMonth = users.filter(
    (u) => u.createdAt && new Date(u.createdAt) > oneMonthAgo,
  ).length;
  const activeThisWeek = users.filter(
    (u) => u.lastActive && new Date(u.lastActive) > oneWeekAgo,
  ).length;

  const byRegion = {};
  users.forEach((u) => {
    const region = u.location || "Unknown";
    byRegion[region] = (byRegion[region] || 0) + 1;
  });

  return {
    users: {
      total: stats.usersTotal,
      founders: stats.foundersCount,
      teamMembers: stats.teamCount,
      talent: stats.talentCount,
      newThisWeek,
      newThisMonth,
      activeThisWeek,
      byRegion,
    },
    startups: {
      total: stats.startupsTotal,
      byStage: startups?.byStage || {},
      byIndustry: startups?.byIndustry || {},
      averageTeamSize:
        stats.startupsTotal > 0 && stats.teamCount > 0
          ? Math.round((stats.teamCount / stats.startupsTotal) * 10) / 10
          : 0,
    },
    outcomes: {
      total: stats.outcomesTotal,
      completed: stats.outcomesCompleted,
      inProgress: Math.max(0, stats.outcomesTotal - stats.outcomesCompleted),
      completionRate:
        stats.outcomesTotal === 0
          ? 0
          : Math.round((stats.outcomesCompleted / stats.outcomesTotal) * 100),
      thisWeek: 0,
    },
    tasks: {
      total: stats.tasksTotal,
      completed: stats.tasksCompleted,
      inProgress: Math.max(0, stats.tasksTotal - stats.tasksCompleted),
      completionRate:
        stats.tasksTotal === 0
          ? 0
          : Math.round((stats.tasksCompleted / stats.tasksTotal) * 100),
    },
    engagement: {
      dailyActiveUsers: activeThisWeek,
      weeklyActiveUsers: activeThisWeek,
      monthlyActiveUsers: newThisMonth,
      averageSessionsPerUser:
        stats.usersTotal > 0
          ? Math.round(
              ((stats.tasksTotal + stats.outcomesTotal) / stats.usersTotal) * 10,
            ) / 10
          : 0,
    },
  };
}

/**
 * Helper: Check if role is team member (handles variations)
 */
function isTeamMemberRole(role) {
  const teamRoles = ["team-member", "team", "team member", "teammember"];
  return teamRoles.includes(role.toLowerCase());
}

/**
 * Helper: Normalize role name
 */
function normalizeRole(role) {
  const lowerRole = role.toLowerCase();
  if (isTeamMemberRole(lowerRole)) return "team-member";
  if (lowerRole === "founder") return "founder";
  if (lowerRole === "talent") return "talent";
  return role;
}

/**
 * Get all users from ALL localStorage sources
 */
export async function getAllUsers() {
  const snap = await getServerSnapshot();
  if (snap?.users?.length) {
    return snap.users.map((u) => ({
      ...u,
      role: normalizeRole(u.role),
    }));
  }

  console.log("🔍 [Analytics] Starting comprehensive user fetch...");

  const userMap = new Map();

  // PHASE 1: Get primary user data (SOURCE OF TRUTH for current roles)
  // These have the most up-to-date role information

  // Source 1: registered_users (PRIMARY SOURCE - most current data)
  try {
    const registeredUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.registeredUsers) || "[]",
    );
    console.log(
      "📊 [Analytics] Found registered_users:",
      registeredUsers.length,
    );
    registeredUsers.forEach((user) => {
      if (user.id && user.email) {
        userMap.set(user.id, {
          ...user,
          role: normalizeRole(user.role),
          lastActive: user.createdAt,
          totalOutcomes: 0,
          completedOutcomes: 0,
          totalTasks: 0,
          completedTasks: 0,
        });
        console.log(`   ✓ User: ${user.email} → Role: ${user.role}`);
      }
    });
  } catch (error) {
    console.error("❌ [Analytics] Error reading registered_users:", error);
  }

  // Source 2: startupverse_users (legacy/compatibility)
  try {
    const allUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
    );
    console.log("📊 [Analytics] Found startupverse_users:", allUsers.length);
    allUsers.forEach((user) => {
      if (user.id && user.email) {
        // Only add if not already in map, OR update if this has more recent data
        const existing = userMap.get(user.id);
        if (!existing) {
          userMap.set(user.id, {
            ...user,
            role: normalizeRole(user.role),
            lastActive: user.createdAt,
            totalOutcomes: 0,
            completedOutcomes: 0,
            totalTasks: 0,
            completedTasks: 0,
          });
          console.log(`   ✓ User: ${user.email} → Role: ${user.role}`);
        } else {
          // Keep the current role from registered_users (it's more current)
          console.log(
            `   ↻ User ${user.email} already exists with role: ${existing.role}`,
          );
        }
      }
    });
  } catch (error) {
    console.error("❌ [Analytics] Error reading startupverse_users:", error);
  }

  // Source 3: Current user
  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.currentUser) || "null",
    );
    if (currentUser && currentUser.id && currentUser.email) {
      const existing = userMap.get(currentUser.id);
      if (!existing) {
        console.log("📊 [Analytics] Found current user:", currentUser.email);
        userMap.set(currentUser.id, {
          ...currentUser,
          role: normalizeRole(currentUser.role),
          lastActive: new Date().toISOString(),
          totalOutcomes: 0,
          completedOutcomes: 0,
          totalTasks: 0,
          completedTasks: 0,
        });
        console.log(
          `   ✓ Current user: ${currentUser.email} → Role: ${currentUser.role}`,
        );
      } else {
        // Update last active for current user
        existing.lastActive = new Date().toISOString();
        console.log(
          `   ↻ Current user ${currentUser.email} role: ${existing.role}`,
        );
      }
    }
  } catch (error) {
    console.error("❌ [Analytics] Error reading current user:", error);
  }

  // PHASE 2: Enrich with profile data (DO NOT OVERWRITE ROLES)
  // Profiles might have old role data, so we only use them for enrichment

  // Source 4: Founder profiles (enrich founder data, add missing founders)
  try {
    const founderProfiles = JSON.parse(
      localStorage.getItem("startupverse_founder_profiles") || "[]",
    );
    console.log(
      "📊 [Analytics] Found founder profiles:",
      founderProfiles.length,
    );
    founderProfiles.forEach((profile) => {
      if (profile.founderId && profile.founderEmail) {
        const existing = userMap.get(profile.founderId);
        if (existing) {
          // User exists - just enrich with startup data, DON'T change role
          if (!existing.startupName) {
            existing.startupName = profile.startupName || profile.companyName;
          }
          console.log(
            `   ↻ Enriching ${existing.email} with startup: ${existing.startupName}`,
          );
        } else {
          // New founder not in main list - add them
          userMap.set(profile.founderId, {
            id: profile.founderId,
            name: profile.founderName || "Founder",
            email: profile.founderEmail,
            role: "founder",
            createdAt: profile.createdAt || new Date().toISOString(),
            onboardingComplete: true,
            profile: profile,
            lastActive: profile.createdAt || new Date().toISOString(),
            totalOutcomes: 0,
            completedOutcomes: 0,
            totalTasks: 0,
            completedTasks: 0,
            startupName: profile.startupName || profile.companyName,
          });
          console.log(`   ✓ New founder from profile: ${profile.founderEmail}`);
        }
      }
    });
  } catch (error) {
    console.error("❌ [Analytics] Error reading founder profiles:", error);
  }

  // Source 5: Talent profiles (enrich talent data, but DON'T overwrite if they became team members)
  try {
    const talentProfiles = JSON.parse(
      localStorage.getItem("startupverse_talent_profiles") || "[]",
    );
    console.log("📊 [Analytics] Found talent profiles:", talentProfiles.length);
    talentProfiles.forEach((profile) => {
      if (profile.id && profile.email) {
        const existing = userMap.get(profile.id);
        if (existing) {
          // User exists - they might have transitioned from talent to team member
          if (existing.role === "talent") {
            // Still talent, safe to enrich
            console.log(`   ↻ Enriching talent: ${existing.email}`);
          } else {
            // Role changed! They were talent but are now something else (likely team member)
            console.log(
              `   🔄 ROLE TRANSITION: ${existing.email} was talent, now ${existing.role}`,
            );
            // Keep current role, don't overwrite
          }
          // Add talent profile data for reference
          if (!existing.profile) {
            existing.profile = profile;
          }
        } else {
          // New talent not in main list - add them as talent
          userMap.set(profile.id, {
            id: profile.id,
            name: profile.name || "Talent",
            email: profile.email,
            role: "talent",
            createdAt: profile.createdAt || new Date().toISOString(),
            onboardingComplete: true,
            profile: profile,
            lastActive: profile.createdAt || new Date().toISOString(),
            totalOutcomes: 0,
            completedOutcomes: 0,
            totalTasks: 0,
            completedTasks: 0,
          });
          console.log(`   ✓ New talent from profile: ${profile.email}`);
        }
      }
    });
  } catch (error) {
    console.error("❌ [Analytics] Error reading talent profiles:", error);
  }

  // Enrich with activity metrics
  userMap.forEach((user, userId) => {
    try {
      // Get outcomes
      const outcomeKey = `weeklyOutcomes_${userId}`;
      const outcomes = JSON.parse(localStorage.getItem(outcomeKey) || "[]");
      user.totalOutcomes = outcomes.length;
      user.completedOutcomes = outcomes.filter(
        (o) => o.status === "completed",
      ).length;

      // Get tasks
      const taskKey = `tasks_${userId}`;
      const tasks = JSON.parse(localStorage.getItem(taskKey) || "[]");
      user.totalTasks = tasks.length;
      user.completedTasks = tasks.filter(
        (t) => t.status === "completed",
      ).length;

      // Update last active if they have recent activity
      if (outcomes.length > 0 || tasks.length > 0) {
        user.lastActive = new Date().toISOString();
      }

      // Get startup info if founder
      if (user.role === "founder" && !user.startupName) {
        const founderProfiles = JSON.parse(
          localStorage.getItem("startupverse_founder_profiles") || "[]",
        );
        const profile = founderProfiles.find((p) => p.founderId === userId);
        if (profile) {
          user.startupName =
            profile.startupName || profile.companyName || "Unnamed Startup";
        } else if (user.profile) {
          user.startupName =
            user.profile.startupName ||
            user.profile.companyName ||
            "Unnamed Startup";
        }
      }
    } catch (error) {
      console.error(`❌ [Analytics] Error enriching user ${userId}:`, error);
    }
  });

  const users = Array.from(userMap.values());

  // Debug: Log user breakdown
  console.log("✅ [Analytics] Total users found:", users.length);
  console.log("📊 [Analytics] User breakdown:");
  console.log(
    "   - Founders:",
    users.filter((u) => u.role === "founder").length,
  );
  console.log(
    "   - Team Members:",
    users.filter((u) => isTeamMemberRole(u.role)).length,
  );
  console.log("   - Talent:", users.filter((u) => u.role === "talent").length);
  console.log(
    "📋 [Analytics] All users:",
    users.map((u) => ({ name: u.name, email: u.email, role: u.role })),
  );

  return users;
}

/**
 * Get comprehensive platform analytics
 */
export async function getPlatformAnalytics() {
  const snap = await getServerSnapshot();
  if (snap) {
    return mapSnapshotToPlatformAnalytics(snap);
  }

  console.log("📊 [Analytics] Starting comprehensive analytics calculation...");

  const users = await getAllUsers();

  // Calculate date ranges
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // User analytics
  const founders = users.filter((u) => u.role === "founder");
  const teamMembers = users.filter((u) => isTeamMemberRole(u.role));
  const talent = users.filter((u) => u.role === "talent");

  const userAnalytics = {
    total: users.length,
    founders: founders.length,
    teamMembers: teamMembers.length,
    talent: talent.length,
    newThisWeek: users.filter((u) => new Date(u.createdAt) > oneWeekAgo).length,
    newThisMonth: users.filter((u) => new Date(u.createdAt) > oneMonthAgo)
      .length,
    activeThisWeek: users.filter(
      (u) => u.lastActive && new Date(u.lastActive) > oneWeekAgo,
    ).length,
    byRegion: {},
  };

  console.log("✅ [Analytics] User analytics:", userAnalytics);

  // Count by region
  users.forEach((user) => {
    const region = user.location || user.profile?.location || "Unknown";
    userAnalytics.byRegion[region] = (userAnalytics.byRegion[region] || 0) + 1;
  });

  // Startup analytics - count unique startups from founders
  const founderProfiles = JSON.parse(
    localStorage.getItem("startupverse_founder_profiles") || "[]",
  );
  console.log("📊 [Analytics] Founder profiles:", founderProfiles.length);

  // Each founder represents a startup
  const startupCount =
    founders.length > 0 ? founders.length : founderProfiles.length;

  const startupAnalytics = {
    total: startupCount,
    byStage: {},
    byIndustry: {},
    averageTeamSize: 0,
  };

  // Collect stage and industry data from founder profiles
  founderProfiles.forEach((profile) => {
    // Stage
    const stage = profile.startupStage || profile.stage || "Unknown";
    startupAnalytics.byStage[stage] =
      (startupAnalytics.byStage[stage] || 0) + 1;

    // Industry
    const industry = profile.industry || "Unknown";
    startupAnalytics.byIndustry[industry] =
      (startupAnalytics.byIndustry[industry] || 0) + 1;
  });

  // Also check user profiles for stage/industry
  founders.forEach((founder) => {
    const profile = founder.profile;
    if (profile) {
      const stage = profile.startupStage || profile.stage;
      if (stage && !Object.keys(startupAnalytics.byStage).includes(stage)) {
        startupAnalytics.byStage[stage] =
          (startupAnalytics.byStage[stage] || 0) + 1;
      }

      const industry = profile.industry;
      if (
        industry &&
        !Object.keys(startupAnalytics.byIndustry).includes(industry)
      ) {
        startupAnalytics.byIndustry[industry] =
          (startupAnalytics.byIndustry[industry] || 0) + 1;
      }
    }
  });

  // Calculate average team size
  if (startupCount > 0 && teamMembers.length > 0) {
    startupAnalytics.averageTeamSize =
      Math.round((teamMembers.length / startupCount) * 10) / 10;
  }

  console.log("✅ [Analytics] Startup analytics:", startupAnalytics);

  // Outcome analytics
  let allOutcomes = [];
  users.forEach((user) => {
    const outcomeKey = `weeklyOutcomes_${user.id}`;
    try {
      const outcomes = JSON.parse(localStorage.getItem(outcomeKey) || "[]");
      allOutcomes = allOutcomes.concat(outcomes);
    } catch (error) {
      console.error(
        `❌ [Analytics] Error reading outcomes for ${user.id}:`,
        error,
      );
    }
  });

  const outcomeAnalytics = {
    total: allOutcomes.length,
    completed: allOutcomes.filter((o) => o.status === "completed").length,
    inProgress: allOutcomes.filter((o) => o.status === "in-progress").length,
    completionRate: 0,
    thisWeek: allOutcomes.filter((o) => {
      try {
        const createdAt = new Date(o.createdAt || o.created_at);
        return createdAt > oneWeekAgo;
      } catch {
        return false;
      }
    }).length,
  };

  if (outcomeAnalytics.total > 0) {
    outcomeAnalytics.completionRate = Math.round(
      (outcomeAnalytics.completed / outcomeAnalytics.total) * 100,
    );
  }

  console.log("✅ [Analytics] Outcome analytics:", outcomeAnalytics);

  // Task analytics
  let allTasks = [];
  users.forEach((user) => {
    const taskKey = `tasks_${user.id}`;
    try {
      const tasks = JSON.parse(localStorage.getItem(taskKey) || "[]");
      allTasks = allTasks.concat(tasks);
    } catch (error) {
      console.error(
        `❌ [Analytics] Error reading tasks for ${user.id}:`,
        error,
      );
    }
  });

  const taskAnalytics = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "completed").length,
    inProgress: allTasks.filter(
      (t) => t.status === "in-progress" || t.status === "pending",
    ).length,
    completionRate: 0,
  };

  if (taskAnalytics.total > 0) {
    taskAnalytics.completionRate = Math.round(
      (taskAnalytics.completed / taskAnalytics.total) * 100,
    );
  }

  console.log("✅ [Analytics] Task analytics:", taskAnalytics);

  // Engagement analytics
  const engagementAnalytics = {
    dailyActiveUsers: users.filter((u) => {
      if (!u.lastActive) return false;
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return new Date(u.lastActive) > oneDayAgo;
    }).length,
    weeklyActiveUsers: userAnalytics.activeThisWeek,
    monthlyActiveUsers: users.filter((u) => {
      if (!u.lastActive) return false;
      return new Date(u.lastActive) > oneMonthAgo;
    }).length,
    averageSessionsPerUser:
      users.length > 0
        ? Math.round(
            ((allTasks.length + allOutcomes.length) / users.length) * 10,
          ) / 10
        : 0,
  };

  console.log("✅ [Analytics] Engagement analytics:", engagementAnalytics);

  return {
    users: userAnalytics,
    startups: startupAnalytics,
    outcomes: outcomeAnalytics,
    tasks: taskAnalytics,
    engagement: engagementAnalytics,
  };
}

/**
 * Get user growth data for charts (last 30 days)
 */
export async function getUserGrowthData() {
  const snap = await getServerSnapshot();
  if (snap?.growthData?.length) {
    return snap.growthData;
  }

  const users = await getAllUsers();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Group by date
  const dateMap = new Map();

  // Initialize all dates
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    dateMap.set(dateStr, 0);
  }

  // Count cumulative users
  let cumulativeCount = 0;
  const sortedUsers = users.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  sortedUsers.forEach((user) => {
    const userDate = new Date(user.createdAt);
    if (userDate < thirtyDaysAgo) {
      cumulativeCount++;
    } else {
      const dateStr = userDate.toISOString().split("T")[0];
      if (dateMap.has(dateStr)) {
        cumulativeCount++;
        dateMap.set(dateStr, cumulativeCount);
      }
    }
  });

  // Fill in cumulative counts
  let lastCount = cumulativeCount;
  const result = [];
  dateMap.forEach((count, date) => {
    const displayCount = count > 0 ? count : lastCount;
    result.push({ date, users: displayCount });
    lastCount = displayCount;
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get outcome completion rate over time (last 8 weeks)
 */
export async function getOutcomeCompletionTrend() {
  const snap = await getServerSnapshot();
  if (snap?.outcomeTrend?.length) {
    return snap.outcomeTrend;
  }

  const users = await getAllUsers();
  const now = new Date();

  const weekData = [];

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(
      now.getTime() - (i * 7 + 7) * 24 * 60 * 60 * 1000,
    );
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    let totalOutcomes = 0;
    let completedOutcomes = 0;

    users.forEach((user) => {
      const outcomeKey = `weeklyOutcomes_${user.id}`;
      try {
        const outcomes = JSON.parse(localStorage.getItem(outcomeKey) || "[]");

        outcomes.forEach((outcome) => {
          try {
            const outcomeDate = new Date(
              outcome.createdAt || outcome.created_at,
            );
            if (outcomeDate >= weekStart && outcomeDate < weekEnd) {
              totalOutcomes++;
              if (outcome.status === "completed") {
                completedOutcomes++;
              }
            }
          } catch (error) {
            // Skip invalid dates
          }
        });
      } catch (error) {
        console.error(`Error reading outcomes for user ${user.id}:`, error);
      }
    });

    const rate =
      totalOutcomes > 0
        ? Math.round((completedOutcomes / totalOutcomes) * 100)
        : 0;
    weekData.push({
      week: `Week ${8 - i}`,
      rate,
    });
  }

  return weekData;
}

/**
 * Get top performing users (by outcomes completed)
 */
export async function getTopPerformers(limit = 10) {
  const snap = await getServerSnapshot();
  if (snap?.topPerformers?.length) {
    return snap.topPerformers.slice(0, limit);
  }

  const users = await getAllUsers();

  return users
    .sort((a, b) => (b.completedOutcomes || 0) - (a.completedOutcomes || 0))
    .slice(0, limit);
}

/**
 * Search users by name or email
 */
export async function searchUsers(query) {
  const users = await getAllUsers();
  const lowerQuery = query.toLowerCase();

  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      (user.startupName && user.startupName.toLowerCase().includes(lowerQuery)),
  );
}
