// Analytics Engine - Calculate metrics and insights from execution data

// Calculate team velocity over time
export function calculateTeamVelocity(executionData, allTasks) {
  const velocity = [];

  // Current week
  if (executionData.currentOutcome) {
    const currentWeek = (executionData.weekHistory.length || 0) + 1;
    const weekTasks = allTasks.filter(
      (t) => t.outcomeId === executionData.currentOutcome?.id,
    );
    const completedTasks = weekTasks.filter((t) => t.status === "completed");

    velocity.push({
      weekNumber: currentWeek,
      weekLabel: `Week ${currentWeek}`,
      tasksCompleted: completedTasks.length,
      tasksCreated: weekTasks.length,
      completionRate:
        weekTasks.length > 0
          ? (completedTasks.length / weekTasks.length) * 100
          : 0,
      averageCompletionTime: calculateAverageCompletionTime(completedTasks),
    });
  }

  // Historical weeks
  executionData.weekHistory.forEach((weekData, index) => {
    const weekNumber = index + 1;
    const weekTasks = allTasks.filter(
      (t) => t.outcomeId === weekData.outcomeId,
    );
    const completedTasks = weekTasks.filter((t) => t.status === "completed");

    velocity.push({
      weekNumber,
      weekLabel: `Week ${weekNumber}`,
      tasksCompleted: completedTasks.length,
      tasksCreated: weekTasks.length,
      completionRate:
        weekTasks.length > 0
          ? (completedTasks.length / weekTasks.length) * 100
          : 0,
      averageCompletionTime: calculateAverageCompletionTime(completedTasks),
    });
  });

  return velocity.sort((a, b) => a.weekNumber - b.weekNumber);
}

function calculateAverageCompletionTime(tasks) {
  if (tasks.length === 0) return 0;

  const times = tasks
    .filter((t) => t.createdAt && t.completedAt)
    .map((t) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt).getTime();
      return (completed - created) / (1000 * 60 * 60 * 24); // days
    });

  if (times.length === 0) return 0;
  return times.reduce((sum, time) => sum + time, 0) / times.length;
}

// Analyze blocker patterns
export function analyzeBlockerPatterns(allTasks) {
  const blockedTasks = allTasks.filter((t) => t.isBlocked);
  const patterns = {};

  blockedTasks.forEach((task) => {
    const reason = task.blockerReason || "Other";

    if (!patterns[reason]) {
      patterns[reason] = {
        reason,
        count: 0,
        affectedTasks: [],
        averageDuration: 0,
        trend: "stable",
      };
    }

    patterns[reason].count++;
    patterns[reason].affectedTasks.push(task.title);
  });

  // Calculate average duration for blocked tasks
  Object.keys(patterns).forEach((reason) => {
    const tasksForReason = blockedTasks.filter(
      (t) => (t.blockerReason || "Other") === reason,
    );
    const durations = tasksForReason
      .filter((t) => t.blockedAt)
      .map((t) => {
        const blocked = new Date(t.blockedAt).getTime();
        const now = new Date().getTime();
        return (now - blocked) / (1000 * 60 * 60 * 24); // days
      });

    if (durations.length > 0) {
      patterns[reason].averageDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }
  });

  return Object.values(patterns).sort((a, b) => b.count - a.count);
}

// Calculate outcome achievement metrics
export function calculateOutcomeMetrics(executionData) {
  const history = executionData.weekHistory;
  const completed = history.filter((w) => w.achievement === "completed").length;
  const partial = history.filter((w) => w.achievement === "partial").length;
  const missed = history.filter((w) => w.achievement === "missed").length;
  const total = history.length;

  const totalProgress = history.reduce(
    (sum, w) => sum + (w.completionPercentage || 0),
    0,
  );
  const averageProgress = total > 0 ? totalProgress / total : 0;

  // Calculate longest streak
  let longestStreak = 0;
  let currentStreakCalc = 0;
  history.forEach((week) => {
    if (week.achievement === "completed" || week.achievement === "partial") {
      currentStreakCalc++;
      longestStreak = Math.max(longestStreak, currentStreakCalc);
    } else {
      currentStreakCalc = 0;
    }
  });

  return {
    totalOutcomes: total,
    completedOutcomes: completed,
    partialOutcomes: partial,
    missedOutcomes: missed,
    achievementRate: total > 0 ? (completed / total) * 100 : 0,
    averageProgress,
    currentStreak: executionData.streak,
    longestStreak: Math.max(longestStreak, executionData.streak),
  };
}

// Generate stage insights
export function generateStageInsights(founderId) {
  const journeyProgress = localStorage.getItem("journey_progress");
  if (!journeyProgress) return [];

  const progress = JSON.parse(journeyProgress);
  const stages = [
    { id: 1, name: "Idea & Validation" },
    { id: 2, name: "Company Formation" },
    { id: 3, name: "Team Building" },
    { id: 4, name: "Product Development" },
    { id: 5, name: "Go to Market" },
    { id: 6, name: "Growth & Scaling" },
  ];

  return stages.map((stage) => {
    const stageData = progress.stageData?.[stage.id];
    const isCompleted = progress.completedStages?.includes(stage.id);
    const isCurrent = progress.currentStage === stage.id;

    let timeSpent = 0;
    if (stageData?.startedAt) {
      const start = new Date(stageData.startedAt).getTime();
      const end = stageData.completedAt
        ? new Date(stageData.completedAt).getTime()
        : new Date().getTime();
      timeSpent = Math.floor((end - start) / (1000 * 60 * 60 * 24)); // days
    }

    return {
      stageId: stage.id,
      stageName: stage.name,
      timeSpent,
      tasksCompleted: stageData?.milestonesCompleted?.length || 0,
      tasksTotal: 8, // Approximate based on STAGE_TASKS
      completionRate: stageData?.completionPercentage || 0,
      status: isCompleted ? "completed" : isCurrent ? "current" : "upcoming",
    };
  });
}

// Calculate productivity trends
export function calculateProductivityTrends(executionData, allTasks) {
  const trends = [];

  // Current week
  if (executionData.currentOutcome) {
    const currentWeek = (executionData.weekHistory.length || 0) + 1;
    const weekTasks = allTasks.filter(
      (t) => t.outcomeId === executionData.currentOutcome?.id,
    );
    const completedTasks = weekTasks.filter((t) => t.status === "completed");
    const blockedTasks = weekTasks.filter((t) => t.isBlocked);

    trends.push({
      period: `Week ${currentWeek}`,
      tasksCompleted: completedTasks.length,
      focusScore: calculateFocusScore(weekTasks),
      blockerCount: blockedTasks.length,
      streakActive: executionData.streak > 0,
    });
  }

  // Historical weeks
  executionData.weekHistory.forEach((weekData, index) => {
    const weekNumber = index + 1;
    const weekTasks = allTasks.filter(
      (t) => t.outcomeId === weekData.outcomeId,
    );
    const completedTasks = weekTasks.filter((t) => t.status === "completed");
    const blockedTasks = weekTasks.filter((t) => t.isBlocked);

    trends.push({
      period: `Week ${weekNumber}`,
      tasksCompleted: completedTasks.length,
      focusScore: calculateFocusScore(weekTasks),
      blockerCount: blockedTasks.length,
      streakActive: weekData.achievement !== "missed",
    });
  });

  return trends.sort((a, b) => {
    const aNum = parseInt(a.period.replace("Week ", ""));
    const bNum = parseInt(b.period.replace("Week ", ""));
    return aNum - bNum;
  });
}

function calculateFocusScore(tasks) {
  if (tasks.length === 0) return 0;

  const completed = tasks.filter((t) => t.status === "completed").length;
  const blocked = tasks.filter((t) => t.isBlocked).length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;

  // Focus score: higher for completed, lower for blocked
  const score =
    (completed * 100 + inProgress * 50 - blocked * 30) / tasks.length;
  return Math.max(0, Math.min(100, score));
}

// Get team performance data
export function getTeamPerformance(founderId, allTasks) {
  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );
  const founder = allUsers.find((u) => u.id === founderId);
  // 🔒 SECURITY FIX: Use startupId/founderId ONLY, removed companyId matching
  const teamMembers = allUsers.filter(
    (u) =>
      (u.startupId === founderId || u.founderId === founderId) &&
      u.id !== founderId,
  );

  const memberStats = teamMembers.map((member) => {
    const memberTasks = allTasks.filter(
      (t) => t.assignedTo === member.id && t.status === "completed",
    );
    return {
      name: member.name,
      tasksCompleted: memberTasks.length,
      avatar: member.avatar,
    };
  });

  // Add founder
  const founderTasks = allTasks.filter(
    (t) =>
      (t.assignedTo === founderId || !t.assignedTo) && t.status === "completed",
  );
  memberStats.push({
    name: founder?.name || "You",
    tasksCompleted: founderTasks.length,
    avatar: founder?.avatar,
  });

  const topPerformers = memberStats
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 5);

  return {
    totalMembers: teamMembers.length + 1,
    activeMembers: memberStats.filter((m) => m.tasksCompleted > 0).length,
    topPerformers,
  };
}

// Main function to generate all analytics
export function generateAnalytics(founderId) {
  const executionDataStr = localStorage.getItem(`execution_data_${founderId}`);
  const executionData = executionDataStr
    ? JSON.parse(executionDataStr)
    : {
        currentOutcome: null,
        weekHistory: [],
        streak: 0,
        hasPartialWeeks: false,
      };

  const tasksStr = localStorage.getItem(`tasks_${founderId}`);
  const allTasks = tasksStr ? JSON.parse(tasksStr) : [];

  return {
    teamVelocity: calculateTeamVelocity(executionData, allTasks),
    blockerPatterns: analyzeBlockerPatterns(allTasks),
    outcomeMetrics: calculateOutcomeMetrics(executionData),
    stageInsights: generateStageInsights(founderId),
    productivityTrends: calculateProductivityTrends(executionData, allTasks),
    teamPerformance: getTeamPerformance(founderId, allTasks),
  };
}
