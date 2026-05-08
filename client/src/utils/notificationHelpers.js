export const createTaskAssignedNotification = (
  taskTitle,
  assignedBy,
  assignedTo,
  taskId,
) => ({
  type: "task-assigned",
  title: "New task assigned to you",
  message: `${assignedBy} assigned you "${taskTitle}"`,
  actionUrl: taskId ? `/tasks/${taskId}` : undefined,
  metadata: {
    taskTitle,
    assignedBy,
    assignedTo,
    taskId,
  },
});

export const createTaskCompletedNotification = (
  taskTitle,
  completedBy,
  taskId,
) => ({
  type: "task-completed",
  title: "Task completed! 🎉",
  message: `${completedBy} completed "${taskTitle}"`,
  actionUrl: taskId ? `/tasks/${taskId}` : undefined,
  metadata: {
    taskTitle,
    completedBy,
    taskId,
  },
});

export const createTaskBlockedNotification = (
  taskTitle,
  blockedBy,
  reason,
  taskId,
) => ({
  type: "task-blocked",
  title: "⚠️ Task blocked",
  message: `"${taskTitle}" is blocked by ${blockedBy}${reason ? `: ${reason}` : ""}`,
  actionUrl: taskId ? `/tasks/${taskId}` : undefined,
  metadata: {
    taskTitle,
    blockedBy,
    reason,
    taskId,
  },
});

export const createDeadlineApproachingNotification = (
  taskTitle,
  daysLeft,
  taskId,
) => ({
  type: "deadline-approaching",
  title: "⏰ Deadline approaching",
  message: `"${taskTitle}" is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
  actionUrl: taskId ? `/tasks/${taskId}` : undefined,
  metadata: {
    taskTitle,
    daysLeft,
    taskId,
  },
});

export const createDeadlineOverdueNotification = (
  taskTitle,
  daysOverdue,
  taskId,
) => ({
  type: "deadline-overdue",
  title: "🚨 Task overdue",
  message: `"${taskTitle}" is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
  actionUrl: taskId ? `/tasks/${taskId}` : undefined,
  metadata: {
    taskTitle,
    daysOverdue,
    taskId,
  },
});

export const createWeeklyReviewReminderNotification = (outcomeTitle) => ({
  type: "weekly-review-reminder",
  title: "📊 Time for weekly review",
  message: `Complete your review for "${outcomeTitle}" to update your streak!`,
  metadata: {
    outcomeTitle,
  },
});

export const createMilestoneCompletedNotification = (
  milestoneTitle,
  outcomeTitle,
) => ({
  type: "milestone-completed",
  title: "🎯 Milestone completed!",
  message: `"${milestoneTitle}" completed for ${outcomeTitle}`,
  metadata: {
    milestoneTitle,
    outcomeTitle,
  },
});

export const createOutcomeAchievedNotification = (outcomeTitle, streak) => ({
  type: "outcome-achieved",
  title: "🏆 Weekly outcome achieved!",
  message: `You crushed "${outcomeTitle}"! Current streak: ${streak} week${streak !== 1 ? "s" : ""} 🔥`,
  metadata: {
    outcomeTitle,
    streak,
  },
});

export const createOutcomePartialNotification = (outcomeTitle, streak) => ({
  type: "outcome-partial",
  title: "⚡ Partial progress on outcome",
  message: `Made progress on "${outcomeTitle}". Current streak: ${streak} week${streak !== 1 ? "s" : ""} ⚡`,
  metadata: {
    outcomeTitle,
    streak,
  },
});

export const createStreakMilestoneNotification = (streak) => {
  let message = "";
  let emoji = "🔥";

  if (streak === 1) {
    message = "First week complete! Keep it going! 🚀";
  } else if (streak === 4) {
    message = "4 weeks strong! Building momentum! 💪";
    emoji = "💪";
  } else if (streak === 8) {
    message = "8 week streak! You're unstoppable! ⚡";
    emoji = "⚡";
  } else if (streak === 12) {
    message = "12 week streak! Legendary execution! 🏆";
    emoji = "🏆";
  } else if (streak % 10 === 0) {
    message = `${streak} week streak! Absolutely crushing it! 🔥`;
  } else {
    return null; // Not a milestone
  }

  return {
    type: "streak-milestone",
    title: `${emoji} ${streak} Week Streak!`,
    message,
    metadata: {
      streak,
    },
  };
};

export const createTeamMemberJoinedNotification = (memberName, role) => ({
  type: "team-member-joined",
  title: "👋 New team member",
  message: `${memberName} joined as ${role}`,
  metadata: {
    memberName,
    role,
  },
});

export const createCommentAddedNotification = (taskTitle, commenterName) => ({
  type: "comment-added",
  title: "💬 New comment",
  message: `${commenterName} commented on "${taskTitle}"`,
  metadata: {
    taskTitle,
    commenterName,
  },
});

// Deadline checker - run this periodically
export const checkDeadlines = (tasks) => {
  const now = new Date();
  const notifications = [];

  tasks.forEach((task) => {
    if (!task.dueDate || task.status === "done") return;

    const dueDate = new Date(task.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Notify 2 days before deadline
    if (diffDays === 2 || diffDays === 1) {
      notifications.push(
        createDeadlineApproachingNotification(task.title, diffDays, task.id),
      );
    }

    // Notify if overdue
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      notifications.push(
        createDeadlineOverdueNotification(task.title, daysOverdue, task.id),
      );
    }
  });

  return notifications;
};

// Check if weekly review is needed (e.g., Friday evening or end of week)
export const checkWeeklyReview = (currentOutcome) => {
  if (!currentOutcome) return null;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday

  // Send reminder on Friday (5) or Sunday (0)
  if (dayOfWeek === 5 || dayOfWeek === 0) {
    // Check if we've already sent a reminder this week
    const lastReminder = localStorage.getItem("last_weekly_review_reminder");
    if (lastReminder) {
      const lastReminderDate = new Date(lastReminder);
      const diffDays = Math.floor(
        (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays < 5) return null; // Don't spam
    }

    localStorage.setItem("last_weekly_review_reminder", now.toISOString());
    return createWeeklyReviewReminderNotification(currentOutcome.title);
  }

  return null;
};

