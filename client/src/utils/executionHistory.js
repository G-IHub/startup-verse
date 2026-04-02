/**
 * Execution History Utility (MVP Gap 2)
 * Calculates and manages talent execution metrics for reputation building
 */

import { getTasks } from "./executionEngine";

/**
 * Calculate execution history for a user
 */
export const calculateExecutionHistory = (userId, userName, founderId) => {
  // Get all tasks for the founder (if specified) or from all founders the user has worked with
  let tasks = [];
  try {
    tasks = founderId ? getTasks(founderId) : getAllTasksForUser(userId);
  } catch (error) {
    console.warn("Failed to load tasks for execution history:", error);
    tasks = [];
  }

  // Filter tasks assigned to this user
  const userTasks = tasks.filter((task) => task.assignedTo === userId);

  // Calculate core metrics
  const completed = userTasks.filter((t) => t.status === "completed").length;
  const inProgress = userTasks.filter((t) => t.status === "in-progress").length;
  const pending = userTasks.filter((t) => t.status === "pending").length;
  const blocked = userTasks.filter((t) => t.status === "blocked").length;
  const total = userTasks.length;

  // Calculate milestone participation
  const milestones = [...new Set(userTasks.map((t) => t.milestoneId))];

  // Calculate rates
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const blockerRate = total > 0 ? Math.round((blocked / total) * 100) : 0;

  // Calculate average completion time (simplified for MVP)
  const averageCompletionTime = calculateAverageCompletionTime(userTasks);

  // Generate contribution graph
  const contributionGraph = generateContributionGraph(userTasks);

  // Calculate streaks (simplified for MVP)
  const { currentStreak, longestStreak } = calculateStreaks(userTasks);

  // Find first and last activity
  const sortedByDate = [...userTasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const firstActivityDate =
    sortedByDate[0]?.createdAt || new Date().toISOString();
  const lastActivityDate =
    sortedByDate[sortedByDate.length - 1]?.completedAt ||
    sortedByDate[sortedByDate.length - 1]?.createdAt ||
    new Date().toISOString();

  // Calculate execution score (0-100)
  const executionScore = calculateExecutionScore({
    completionRate,
    blockerRate,
    totalTasks: total,
    currentStreak,
  });

  return {
    userId,
    userName,
    tasksCompleted: completed,
    tasksInProgress: inProgress,
    tasksPending: pending,
    tasksBlocked: blocked,
    totalTasksAssigned: total,
    milestonesContributed: milestones,
    uniqueMilestonesCount: milestones.length,
    currentStreak,
    longestStreak,
    weeklyOutcomesParticipated: Math.floor(milestones.length / 3), // Rough estimate
    completionRate,
    blockerRate,
    averageCompletionTime,
    contributionGraph,
    lastActivityDate,
    firstActivityDate,
    executionScore,
  };
};

/**
 * Get all tasks for a user across all founders they've worked with
 */
const getAllTasksForUser = (userId) => {
  // For MVP, we'll check localStorage for all founder keys
  const allTasks = [];

  // Iterate through localStorage to find all task keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("startupverse_tasks_")) {
      try {
        const tasks = JSON.parse(localStorage.getItem(key) || "[]");
        allTasks.push(...tasks);
      } catch (error) {
        console.warn("Failed to parse tasks from", key);
      }
    }
  }

  return allTasks;
};

/**
 * Calculate average completion time for completed tasks
 */
const calculateAverageCompletionTime = (tasks) => {
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" && t.completedAt && t.createdAt,
  );

  if (completedTasks.length === 0) return 0;

  const totalHours = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt).getTime();
    const hours = (completed - created) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return Math.round(totalHours / completedTasks.length);
};

/**
 * Generate contribution graph for last 12 weeks
 */
const generateContributionGraph = (tasks) => {
  const weeks = {};
  const now = new Date();

  // Initialize last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const weekId = getWeekId(weekDate);
    const weekLabel = getWeekLabel(weekDate, i);
    weeks[weekId] = { completed: 0, assigned: 0 };
  }

  // Count tasks per week
  tasks.forEach((task) => {
    const taskDate = new Date(task.createdAt);
    const weekId = getWeekId(taskDate);

    if (weeks[weekId]) {
      weeks[weekId].assigned++;
      if (task.status === "completed") {
        weeks[weekId].completed++;
      }
    }
  });

  // Convert to array
  return Object.entries(weeks).map(([weekId, data]) => ({
    weekId,
    weekLabel: getWeekLabel(new Date(weekId), 0),
    tasksCompleted: data.completed,
    tasksAssigned: data.assigned,
  }));
};

/**
 * Get week ID (ISO week format)
 */
const getWeekId = (date) => {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

/**
 * Get week number of year
 */
const getWeekNumber = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Get human-readable week label
 */
const getWeekLabel = (date, weeksAgo) => {
  if (weeksAgo === 0) return "This Week";
  if (weeksAgo === 1) return "Last Week";
  return `${weeksAgo}w ago`;
};

/**
 * Calculate current and longest streaks
 */
const calculateStreaks = (tasks) => {
  // Simplified for MVP - count consecutive weeks with completed tasks
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const weeklyActivity = {};

  completedTasks.forEach((task) => {
    if (task.completedAt) {
      const weekId = getWeekId(new Date(task.completedAt));
      weeklyActivity[weekId] = (weeklyActivity[weekId] || 0) + 1;
    }
  });

  const activeWeeks = Object.keys(weeklyActivity).sort().reverse();

  // Calculate current streak
  let currentStreak = 0;
  const thisWeek = getWeekId(new Date());

  if (activeWeeks.includes(thisWeek)) {
    currentStreak = 1;
    for (let i = 1; i < activeWeeks.length; i++) {
      const prevWeek = getWeekId(
        new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
      );
      if (activeWeeks.includes(prevWeek)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak (simplified)
  const longestStreak = Math.max(
    currentStreak,
    activeWeeks.length > 0 ? activeWeeks.length : 0,
  );

  return { currentStreak, longestStreak };
};

/**
 * Calculate overall execution score (0-100)
 */
const calculateExecutionScore = (metrics) => {
  // Weighted scoring algorithm
  let score = 0;

  // Completion rate (40% of score)
  score += metrics.completionRate * 0.4;

  // Low blocker rate (20% of score)
  score += (100 - metrics.blockerRate) * 0.2;

  // Task volume (20% of score) - logarithmic scale
  const volumeScore = Math.min(100, Math.log(metrics.totalTasks + 1) * 20);
  score += volumeScore * 0.2;

  // Current streak (20% of score)
  const streakScore = Math.min(100, metrics.currentStreak * 10);
  score += streakScore * 0.2;

  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Get execution score label
 */
export const getExecutionScoreLabel = (score) => {
  if (score >= 85) {
    return {
      label: "Exceptional Contributor",
      color: "text-green-600 dark:text-green-400",
      description: "Top-tier execution with consistent delivery",
    };
  } else if (score >= 70) {
    return {
      label: "Strong Contributor",
      color: "text-blue-600 dark:text-blue-400",
      description: "Reliable execution with good consistency",
    };
  } else if (score >= 50) {
    return {
      label: "Active Contributor",
      color: "text-yellow-600 dark:text-yellow-400",
      description: "Regular participation with room for growth",
    };
  } else if (score >= 25) {
    return {
      label: "Emerging Contributor",
      color: "text-orange-600 dark:text-orange-400",
      description: "Early stage with building momentum",
    };
  } else {
    return {
      label: "New to Platform",
      color: "text-gray-600 dark:text-gray-400",
      description: "Just getting started",
    };
  }
};
