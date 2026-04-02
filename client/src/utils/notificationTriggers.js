/**
 * Frontend notification trigger utilities
 * These functions call the backend to create notifications for various platform events
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function createNotification(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Failed to create notification:", await response.text());
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Trigger when a team member is invited
 */
export async function notifyTeamMemberInvited(params) {
  // Note: This would require email-based notification or waiting until the user signs up
  console.log("Team member invited:", params);
}

/**
 * Trigger when a team member joins
 */
export async function notifyTeamMemberJoined(params) {
  await createNotification({
    userId: params.founderId,
    type: "team_member_joined",
    title: "New Team Member Joined",
    message: `${params.teamMemberName} joined your team as ${params.role}`,
    actionUrl: "/team",
    metadata: {
      teamMemberId: params.teamMemberId,
      teamMemberName: params.teamMemberName,
      role: params.role,
    },
  });
}

/**
 * Trigger when a comment is added
 */
export async function notifyCommentAdded(params) {
  await createNotification({
    userId: params.userId,
    type: "comment_added",
    title: `New Comment on ${params.entityType}`,
    message: `${params.commentedByName} commented: "${params.commentText.substring(0, 50)}${params.commentText.length > 50 ? "..." : ""}"`,
    actionUrl: `/${params.entityType}s/${params.entityId}`,
    metadata: {
      commentedBy: params.commentedBy,
      commentedByName: params.commentedByName,
      entityType: params.entityType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
    },
  });
}

/**
 * Trigger when someone reacts to an announcement
 */
export async function notifyAnnouncementReaction(params) {
  await createNotification({
    userId: params.announcementAuthorId,
    type: "announcement_reaction",
    title: "New Reaction",
    message: `${params.reactedByName} reacted ${params.reaction} to "${params.announcementTitle}"`,
    actionUrl: `/announcements/${params.announcementId}`,
    metadata: {
      reactedBy: params.reactedBy,
      reactedByName: params.reactedByName,
      announcementId: params.announcementId,
      announcementTitle: params.announcementTitle,
      reaction: params.reaction,
    },
  });
}

/**
 * Trigger when someone comments on an announcement
 */
export async function notifyAnnouncementComment(params) {
  await createNotification({
    userId: params.announcementAuthorId,
    type: "announcement_comment",
    title: "New Comment on Announcement",
    message: `${params.commentedByName} commented on "${params.announcementTitle}"`,
    actionUrl: `/announcements/${params.announcementId}`,
    metadata: {
      commentedBy: params.commentedBy,
      commentedByName: params.commentedByName,
      announcementId: params.announcementId,
      announcementTitle: params.announcementTitle,
      commentText: params.commentText,
    },
  });
}

/**
 * Trigger when a milestone is completed
 */
export async function notifyMilestoneCompleted(params) {
  // Notify founder
  await createNotification({
    userId: params.founderId,
    type: "milestone_completed",
    title: "🎉 Milestone Completed!",
    message: `Your team completed "${params.milestoneTitle}"`,
    actionUrl: `/milestones/${params.milestoneId}`,
    metadata: {
      milestoneId: params.milestoneId,
      milestoneTitle: params.milestoneTitle,
    },
  });

  // Notify all team members
  for (const memberId of params.teamMemberIds) {
    await createNotification({
      userId: memberId,
      type: "milestone_completed",
      title: "🎉 Milestone Completed!",
      message: `The team completed "${params.milestoneTitle}"`,
      actionUrl: `/milestones/${params.milestoneId}`,
      metadata: {
        milestoneId: params.milestoneId,
        milestoneTitle: params.milestoneTitle,
      },
    });
  }
}

/**
 * Trigger when weekly outcome is achieved
 */
export async function notifyOutcomeAchieved(params) {
  // Notify founder
  await createNotification({
    userId: params.founderId,
    type: "outcome_achieved",
    title: "✅ Weekly Outcome Achieved!",
    message: `"${params.outcomeTitle}" was achieved this week!`,
    actionUrl: `/outcomes/${params.weekId}`,
    metadata: {
      outcomeId: params.outcomeId,
      outcomeTitle: params.outcomeTitle,
      weekId: params.weekId,
    },
  });

  // Notify all team members
  for (const memberId of params.teamMemberIds) {
    await createNotification({
      userId: memberId,
      type: "outcome_achieved",
      title: "✅ Weekly Outcome Achieved!",
      message: `The team achieved "${params.outcomeTitle}" this week!`,
      actionUrl: `/outcomes/${params.weekId}`,
      metadata: {
        outcomeId: params.outcomeId,
        outcomeTitle: params.outcomeTitle,
        weekId: params.weekId,
      },
    });
  }
}

/**
 * Trigger streak milestone notification
 */
export async function notifyStreakMilestone(params) {
  const messages = {
    5: "🔥 You're on fire! 5-week streak!",
    10: "🔥🔥 Incredible! 10-week streak!",
    20: "🔥🔥🔥 Legendary! 20-week streak!",
    50: "🔥🔥🔥🔥 Unstoppable! 50-week streak!",
    100: "🔥🔥🔥🔥🔥 EPIC! 100-week streak!",
  };

  await createNotification({
    userId: params.founderId,
    type: "streak_milestone",
    title: "Streak Milestone Achieved! 🎉",
    message:
      messages[params.streak] || `Amazing! ${params.streak}-week streak!`,
    actionUrl: "/dashboard",
    metadata: {
      streak: params.streak,
    },
  });
}

/**
 * Trigger weekly review reminder
 */
export async function notifyWeeklyReviewReminder(params) {
  await createNotification({
    userId: params.founderId,
    type: "weekly_review_reminder",
    title: "📋 Weekly Review Time",
    message: "Time to review this week's progress and set next week's outcome",
    actionUrl: "/weekly-review",
    metadata: {
      weekId: params.weekId,
    },
  });
}
