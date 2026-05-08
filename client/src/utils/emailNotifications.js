/**
 * Notification Triggers (legacy filename retained)
 * Frontend utility to trigger backend notification routes.
 */

import { API_BASE_URL } from "../config/apiBase.js";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

function resolveArgs(args, orderedKeys) {
  if (args.length === 1 && args[0] && typeof args[0] === "object") {
    return args[0];
  }
  const resolved = {};
  orderedKeys.forEach((key, index) => {
    resolved[key] = args[index];
  });
  return resolved;
}

async function postNotification(path, payload) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`Failed notification request (${path}):`, await response.text());
      return false;
    }

    const result = await response.json();
    return result?.success === true;
  } catch (error) {
    console.warn(`Failed notification request (${path}):`, error);
    return false;
  }
}

function buildPayload(userId, message, metadata = {}) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return null;
  return {
    userId: normalizedUserId,
    message,
    metadata,
  };
}

/**
 * Send weekly outcome reminder to founder.
 */
export async function sendWeeklyOutcomeReminder(...args) {
  const params = resolveArgs(args, [
    "userId",
    "founderEmail",
    "founderName",
    "weekNumber",
  ]);

  const payload = buildPayload(
    params.userId,
    params.message || `Weekly outcome reminder for week ${params.weekNumber || ""}`.trim(),
    {
      founderEmail: params.founderEmail || "",
      founderName: params.founderName || "",
      weekNumber: params.weekNumber || null,
      ...(params.metadata || {}),
    },
  );

  if (!payload) return false;
  return postNotification("/notifications/weekly-outcome-reminder", payload);
}

/**
 * Send task assigned notification to a team member.
 */
export async function sendTaskAssignedNotification(...args) {
  const params = resolveArgs(args, [
    "userId",
    "teamMemberEmail",
    "teamMemberName",
    "taskTitle",
    "taskDescription",
    "founderName",
    "milestoneName",
  ]);

  const payload = buildPayload(
    params.userId,
    params.message ||
      `${params.founderName || "A founder"} assigned "${params.taskTitle || "a task"}" to you.`,
    {
      teamMemberEmail: params.teamMemberEmail || "",
      teamMemberName: params.teamMemberName || "",
      taskTitle: params.taskTitle || "",
      taskDescription: params.taskDescription || "",
      founderName: params.founderName || "",
      milestoneName: params.milestoneName || "",
      ...(params.metadata || {}),
    },
  );

  if (!payload) return false;
  return postNotification("/notifications/task-assigned", payload);
}

/**
 * Send task blocked notification (typically to founder).
 */
export async function sendTaskBlockedNotification(...args) {
  const params = resolveArgs(args, [
    "userId",
    "founderEmail",
    "founderName",
    "taskTitle",
    "blockerReason",
    "blockerNote",
    "teamMemberName",
  ]);

  const payload = buildPayload(
    params.userId,
    params.message ||
      `Task "${params.taskTitle || ""}" is blocked${params.blockerReason ? `: ${params.blockerReason}` : ""}.`,
    {
      founderEmail: params.founderEmail || "",
      founderName: params.founderName || "",
      taskTitle: params.taskTitle || "",
      blockerReason: params.blockerReason || "",
      blockerNote: params.blockerNote || "",
      teamMemberName: params.teamMemberName || "",
      ...(params.metadata || {}),
    },
  );

  if (!payload) return false;
  return postNotification("/notifications/task-blocked", payload);
}

/**
 * Send weekly review reminder to founder.
 */
export async function sendWeeklyReviewReminder(...args) {
  const params = resolveArgs(args, [
    "userId",
    "founderEmail",
    "founderName",
    "weekNumber",
    "tasksCompleted",
    "totalTasks",
  ]);

  const payload = buildPayload(
    params.userId,
    params.message || `Weekly review reminder for week ${params.weekNumber || ""}`.trim(),
    {
      founderEmail: params.founderEmail || "",
      founderName: params.founderName || "",
      weekNumber: params.weekNumber || null,
      tasksCompleted: params.tasksCompleted || null,
      totalTasks: params.totalTasks || null,
      ...(params.metadata || {}),
    },
  );

  if (!payload) return false;
  return postNotification("/notifications/weekly-review-reminder", payload);
}

/**
 * Send streak-at-risk notification to founder.
 */
export async function sendStreakAtRiskNotification(...args) {
  const params = resolveArgs(args, [
    "userId",
    "founderEmail",
    "founderName",
    "currentStreak",
  ]);

  const payload = buildPayload(
    params.userId,
    params.message || `Your execution streak (${params.currentStreak || 0}) is at risk.`,
    {
      founderEmail: params.founderEmail || "",
      founderName: params.founderName || "",
      currentStreak: params.currentStreak || 0,
      ...(params.metadata || {}),
    },
  );

  if (!payload) return false;
  return postNotification("/notifications/streak-at-risk", payload);
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
