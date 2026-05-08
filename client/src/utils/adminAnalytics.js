/**
 * Admin Analytics Utilities - FIXED VERSION
 *
 * Prefers server snapshot (MongoDB) when the admin is authenticated; legacy
 * browser aggregation has been removed.
 */

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
 * Get all users from the admin analytics snapshot (server).
 */
export async function getAllUsers() {
  const snap = await getServerSnapshot();
  if (snap?.users?.length) {
    return snap.users.map((u) => ({
      ...u,
      role: normalizeRole(u.role),
    }));
  }

  console.warn("[Analytics] No server snapshot; legacy browser aggregation removed.");
  return [];
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

  // Startup analytics — browser-local founder profiles removed; rely on user rows only
  const founderProfiles = [];
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

  let allOutcomes = [];

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

  let allTasks = [];

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
      try {
        const outcomes = [];

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
