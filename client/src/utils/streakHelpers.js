/**
 * Streak Management Utilities
 * Handles streak calculations, warnings, and milestone detection
 */

/**
 * Calculate days remaining in current week
 */
export function getDaysLeftInWeek(weekStartDate) {
  const start = new Date(weekStartDate);
  const now = new Date();
  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const daysLeft = Math.ceil(
    (weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, Math.min(7, daysLeft));
}

/**
 * Check if streak is at risk of breaking
 */
export function isStreakAtRisk(weekProgress, daysLeft, currentStreak) {
  // No risk if no streak yet
  if (currentStreak === 0) return false;

  // Week complete - no risk
  if (weekProgress >= 100) return false;

  // Critical: Less than 3 days and under 50% progress
  if (daysLeft <= 3 && weekProgress < 50) return true;

  // Warning: Less than 2 days and under 70% progress
  if (daysLeft <= 2 && weekProgress < 70) return true;

  // Urgent: Last day and not complete
  if (daysLeft <= 1 && weekProgress < 100) return true;

  return false;
}

/**
 * Get urgency level for streak warnings
 */
export function getStreakUrgencyLevel(weekProgress, daysLeft) {
  if (weekProgress >= 100) return "none";

  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 2 && weekProgress < 50) return "critical";
  if (daysLeft <= 3 && weekProgress < 30) return "urgent";
  if (daysLeft <= 3 && weekProgress < 70) return "warning";

  return "none";
}

/**
 * Get warning message based on urgency
 */
export function getStreakWarningMessage(
  streak,
  weekProgress,
  daysLeft,
  urgency,
) {
  const remaining = 100 - weekProgress;

  if (urgency === "critical") {
    if (daysLeft <= 1) {
      return `🚨 FINAL ${daysLeft * 24} HOURS! Complete ${remaining}% to save your ${streak}-week streak!`;
    }
    return `⚠️ CRITICAL: ${daysLeft} days to complete ${remaining}% or lose your ${streak}-week streak!`;
  }

  if (urgency === "urgent") {
    return `⏰ URGENT: ${daysLeft} days left with ${remaining}% remaining. Your ${streak}-week streak needs attention!`;
  }

  // warning
  return `🔔 Reminder: ${daysLeft} days left to complete this week's outcome (${remaining}% remaining)`;
}

/**
 * Check if a streak number is a milestone
 */
export function isMilestone(streak) {
  return [1, 3, 5, 10, 20, 50, 100].includes(streak);
}

/**
 * Get the next milestone
 */
export function getNextMilestone(currentStreak) {
  const milestones = [1, 3, 5, 10, 20, 50, 100];
  return milestones.find((m) => m > currentStreak) || 100;
}

/**
 * Calculate progress to next milestone
 */
export function getProgressToNextMilestone(currentStreak) {
  const next = getNextMilestone(currentStreak);
  const previous =
    [...[0, 1, 3, 5, 10, 20, 50]].reverse().find((m) => m <= currentStreak) ||
    0;

  const total = next - previous;
  const progress = currentStreak - previous;
  const percentage = total > 0 ? (progress / total) * 100 : 0;

  return {
    next,
    current: currentStreak,
    percentage,
    weeksRemaining: next - currentStreak,
  };
}

/**
 * Get streak tier information
 */
export function getStreakTier(streak) {
  if (streak >= 12)
    return {
      name: "LEGENDARY",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      minWeeks: 12,
      description: "Top 3% globally - Iconic execution",
    };

  if (streak >= 8)
    return {
      name: "ELITE",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      minWeeks: 8,
      description: "Top 10% worldwide - Strong momentum",
    };

  if (streak >= 4)
    return {
      name: "STRONG",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      minWeeks: 4,
      description: "Consistent execution - Building momentum",
    };

  if (streak >= 2)
    return {
      name: "BUILDING",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      minWeeks: 2,
      description: "Early momentum - Keep going!",
    };

  return {
    name: "STARTER",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    minWeeks: 1,
    description: "First week complete - Great start!",
  };
}

/**
 * Calculate week progress from execution data
 */
export function calculateWeekProgress(currentOutcome) {
  if (!currentOutcome || !currentOutcome.milestones) return 0;

  const totalTasks = currentOutcome.milestones.reduce(
    (sum, m) => sum + (m.totalTasks || 0),
    0,
  );
  const completedTasks = currentOutcome.milestones.reduce(
    (sum, m) => sum + (m.tasksCompleted || 0),
    0,
  );

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

/**
 * Get motivational message based on streak and progress
 */
export function getStreakMotivation(streak, weekProgress) {
  if (weekProgress >= 100) {
    return [
      "🎉 Week complete! You're unstoppable!",
      "✨ Another week conquered! Keep the momentum!",
      "🔥 Streak secured! You're building something special!",
      "⚡ Week done! This is how legends are made!",
      "🏆 Success! Your consistency is paying off!",
    ][Math.floor(Math.random() * 5)];
  }

  if (weekProgress >= 80) {
    return [
      "💪 Almost there! Finish strong!",
      "🎯 So close! You've got this!",
      "⚡ Final push! Victory is near!",
      "🚀 In the home stretch! Don't stop now!",
    ][Math.floor(Math.random() * 4)];
  }

  if (weekProgress >= 50) {
    return [
      "📈 Halfway there! Momentum is building!",
      "💼 Solid progress! Keep executing!",
      "🔄 Great work! Stay focused!",
      "⏫ On track! Maintain the pace!",
    ][Math.floor(Math.random() * 4)];
  }

  if (weekProgress >= 25) {
    return [
      "🌱 Good start! Keep the energy up!",
      "📊 Progress is progress! Keep going!",
      "🎬 Building momentum! Don't stop!",
      "🔨 Getting there! Stay committed!",
    ][Math.floor(Math.random() * 4)];
  }

  return [
    "🎯 Time to execute! Your team is counting on you!",
    "⚡ Let's build! Every task completed counts!",
    "🚀 Start strong! The first step is the hardest!",
    "💡 Make it happen! Action beats perfection!",
  ][Math.floor(Math.random() * 4)];
}

/**
 * Check if user should see streak recovery warning
 */
export function shouldShowRecoveryWarning(streak, weekProgress, daysLeft) {
  if (streak === 0) return false;
  if (weekProgress >= 100) return false;

  // Show warning if streak >= 3 and in last 3 days with < 70% progress
  if (streak >= 3 && daysLeft <= 3 && weekProgress < 70) return true;

  // Show warning if any streak and last day with < 100% progress
  if (daysLeft <= 1 && weekProgress < 100) return true;

  return false;
}

/**
 * Get achievement badge for milestone streaks
 */
export function getStreakBadge(streak) {
  const badges = {
    1: {
      emoji: "⭐",
      title: "First Steps",
      subtitle: "Completed your first week",
      rarity: "common",
    },
    3: {
      emoji: "🔥",
      title: "Building Momentum",
      subtitle: "3 consecutive weeks",
      rarity: "rare",
    },
    5: {
      emoji: "⚡",
      title: "Elite Execution",
      subtitle: "5 week streak - Top 10%",
      rarity: "epic",
    },
    10: {
      emoji: "👑",
      title: "Legendary",
      subtitle: "10 week streak - Top 3%",
      rarity: "legendary",
    },
    20: {
      emoji: "🏆",
      title: "Unstoppable",
      subtitle: "20 week streak - Top 1%",
      rarity: "legendary",
    },
    50: {
      emoji: "💎",
      title: "Hall of Fame",
      subtitle: "50 week streak - Mythic",
      rarity: "mythic",
    },
  };

  return badges[streak] || null;
}

/**
 * Format streak data for display
 */
export function formatStreakData(executionData) {
  const currentOutcome = executionData?.currentOutcome;
  const weekStartDate = currentOutcome?.startDate || new Date().toISOString();
  const weekProgress = calculateWeekProgress(currentOutcome);
  const daysLeft = getDaysLeftInWeek(weekStartDate);
  const currentStreak = executionData?.streak || 0;

  return {
    currentStreak,
    longestStreak: executionData?.longestStreak || currentStreak,
    weekStartDate,
    weekEndDate: new Date(
      new Date(weekStartDate).getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    weekProgress,
    isAtRisk: isStreakAtRisk(weekProgress, daysLeft, currentStreak),
    daysUntilReset: daysLeft,
    lastCompletedWeek: executionData?.lastCompletedWeek,
  };
}
