/**
 * Email Notification Triggers (MVP Gap 3)
 * Frontend utility to trigger email notifications via backend
 */

import { getAccessToken } from "../app/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Send weekly outcome reminder to founder
 */
export async function sendWeeklyOutcomeReminder(
  founderEmail,
  founderName,
  weekNumber,
) {
  try {
    const response = await fetch(
      `${API_BASE}/notifications/weekly-outcome-reminder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          founderEmail,
          founderName,
          weekNumber,
        }),
      },
    );

    const result = await response.json();
    return result.success && result.sent;
  } catch (error) {
    console.warn("Failed to send weekly outcome reminder:", error);
    return false;
  }
}

/**
 * Send task assigned notification to team member
 */
export async function sendTaskAssignedNotification(
  teamMemberEmail,
  teamMemberName,
  taskTitle,
  taskDescription,
  founderName,
  milestoneName,
) {
  try {
    const response = await fetch(`${API_BASE}/notifications/task-assigned`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        teamMemberEmail,
        teamMemberName,
        taskTitle,
        taskDescription,
        founderName,
        milestoneName,
      }),
    });

    const result = await response.json();
    return result.success && result.sent;
  } catch (error) {
    console.warn("Failed to send task assigned notification:", error);
    return false;
  }
}

/**
 * Send task blocked notification to founder
 */
export async function sendTaskBlockedNotification(
  founderEmail,
  founderName,
  taskTitle,
  blockerReason,
  blockerNote,
  teamMemberName,
) {
  try {
    const response = await fetch(`${API_BASE}/notifications/task-blocked`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        founderEmail,
        founderName,
        taskTitle,
        blockerReason,
        blockerNote,
        teamMemberName,
      }),
    });

    const result = await response.json();
    return result.success && result.sent;
  } catch (error) {
    console.warn("Failed to send task blocked notification:", error);
    return false;
  }
}

/**
 * Send weekly review reminder to founder
 */
export async function sendWeeklyReviewReminder(
  founderEmail,
  founderName,
  weekNumber,
  tasksCompleted,
  totalTasks,
) {
  try {
    const response = await fetch(
      `${API_BASE}/notifications/weekly-review-reminder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          founderEmail,
          founderName,
          weekNumber,
          tasksCompleted,
          totalTasks,
        }),
      },
    );

    const result = await response.json();
    return result.success && result.sent;
  } catch (error) {
    console.warn("Failed to send weekly review reminder:", error);
    return false;
  }
}

/**
 * Send streak at risk notification to founder
 */
export async function sendStreakAtRiskNotification(
  founderEmail,
  founderName,
  currentStreak,
) {
  try {
    const response = await fetch(`${API_BASE}/notifications/streak-at-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        founderEmail,
        founderName,
        currentStreak,
      }),
    });

    const result = await response.json();
    return result.success && result.sent;
  } catch (error) {
    console.warn("Failed to send streak at risk notification:", error);
    return false;
  }
}

/**
 * Check if founder needs weekly outcome reminder (Sunday evening check)
 */
export function shouldSendOutcomeReminder(executionData) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours();

  // Sunday evening between 6pm and 11pm
  if (day === 0 && hour >= 18 && hour <= 23) {
    // Check if they've already set next week's outcome
    return (
      !executionData?.currentOutcome ||
      executionData.currentOutcome.weekId !== getCurrentWeekId()
    );
  }

  return false;
}

/**
 * Check if founder missed outcome selection (Monday morning check)
 */
export function shouldSendMissedOutcomeAlert(executionData) {
  const now = new Date();
  const day = now.getDay(); // 1 = Monday
  const hour = now.getHours();

  // Monday morning between 9am and 12pm
  if (day === 1 && hour >= 9 && hour <= 12) {
    return (
      !executionData?.currentOutcome ||
      executionData.currentOutcome.weekId !== getCurrentWeekId()
    );
  }

  return false;
}

/**
 * Check if founder needs review reminder (Friday evening)
 */
export function shouldSendReviewReminder(executionData) {
  const now = new Date();
  const day = now.getDay(); // 5 = Friday
  const hour = now.getHours();

  // Friday evening between 5pm and 10pm
  if (day === 5 && hour >= 17 && hour <= 22) {
    const lastReview =
      executionData?.weekHistory?.[executionData.weekHistory.length - 1];
    const currentWeek = getCurrentWeekId();

    // Check if they've reviewed this week
    return !lastReview || lastReview.weekId !== currentWeek;
  }

  return false;
}

/**
 * Check if streak is at risk (Sunday evening, no review done)
 */
export function shouldSendStreakWarning(executionData) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours();

  // Sunday evening between 8pm and 11pm
  if (day === 0 && hour >= 20 && hour <= 23) {
    const currentStreak = executionData?.currentStreak || 0;
    if (currentStreak === 0) return false;

    const lastReview =
      executionData?.weekHistory?.[executionData.weekHistory.length - 1];
    const currentWeek = getCurrentWeekId();

    // Streak at risk if they have a streak but haven't reviewed this week
    return lastReview?.weekId !== currentWeek;
  }

  return false;
}

/**
 * Get current week ID (ISO week format)
 */
function getCurrentWeekId() {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
