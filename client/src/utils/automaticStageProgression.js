/**
 * Automatic Stage Progression System
 *
 * Checks runtime metrics and automatically progresses founders through stages
 * based on real progress (outcomes, tasks, streak, customers, revenue).
 */

import {
  determineStageFromMetrics,
  getStageName,
} from "./algorithmicStageDetection";
import { getCurrentStage, setCurrentStage } from "./journeyProgress";
import { toast } from "sonner";
import { addStageProgressionWin } from "./wallOfWins";

/**
 * Gather current metrics from localStorage and system state
 */
export function gatherCurrentMetrics() {
  // Get execution engine data
  const outcomesData = JSON.parse(
    localStorage.getItem("founder_outcomes") || "[]",
  );
  const milestonesData = JSON.parse(
    localStorage.getItem("founder_milestones") || "[]",
  );
  const tasksData = JSON.parse(localStorage.getItem("founder_tasks") || "[]");
  const streakData = JSON.parse(
    localStorage.getItem("weekly_outcome_streak") || '{"currentStreak":0}',
  );

  // Get team data
  const teamData = JSON.parse(localStorage.getItem("team_members") || "[]");

  // Get profile data for customer/revenue info (if founders track this)
  const profileData = JSON.parse(
    localStorage.getItem("founder_profile") || "{}",
  );

  // Calculate completion rates
  const completedOutcomes = outcomesData.filter(
    (o) => o.status === "completed",
  ).length;
  const completedMilestones = milestonesData.filter((m) => m.completed).length;
  const completedTasks = tasksData.filter((t) => t.completed).length;
  const totalTasks = tasksData.length;

  return {
    completedOutcomes,
    completedMilestones,
    weeklyStreak: streakData.currentStreak || 0,
    totalTasks,
    completedTasks,
    teamSize: teamData.length + 1, // +1 for founder
    activeUsers: profileData.activeUsers || 0,
    customerCount: profileData.customerCount || 0,
    monthlyRevenue: profileData.monthlyRevenue || 0,
  };
}

/**
 * Check if stage should progress and update if needed
 * Returns true if stage changed, false otherwise
 */
export function checkAndProgressStage() {
  const currentStageId = getCurrentStage();
  const metrics = gatherCurrentMetrics();

  // Determine what stage the metrics suggest
  const suggestedStageId = determineStageFromMetrics(metrics, currentStageId);

  // If suggested stage is higher, progress!
  if (suggestedStageId > currentStageId) {
    setCurrentStage(suggestedStageId);

    const newStageName = getStageName(suggestedStageId);

    // Show celebration toast
    toast.success(`🎉 Stage Advanced: ${newStageName}!`, {
      description: `Your consistent progress has unlocked the next stage of your startup journey.`,
      duration: 6000,
    });

    console.log(
      `📊 [StageProgression] Advanced from Stage ${currentStageId} to Stage ${suggestedStageId}`,
      {
        metrics,
        previousStage: currentStageId,
        newStage: suggestedStageId,
      },
    );

    // 🏆 Add to Wall of Wins in Virtual Office
    addStageProgressionWin(newStageName);

    return true;
  }

  return false;
}

/**
 * Check stage progression with threshold to avoid spam
 * Only shows notification if significant progress made
 */
export function checkStageProgressionWithThreshold(forceCheck = false) {
  // Get last check timestamp
  const lastCheckKey = "last_stage_progression_check";
  const lastCheck = localStorage.getItem(lastCheckKey);
  const now = Date.now();

  // Only check once per hour unless forced
  const oneHour = 60 * 60 * 1000;
  if (!forceCheck && lastCheck && now - parseInt(lastCheck) < oneHour) {
    return false;
  }

  // Update last check timestamp
  localStorage.setItem(lastCheckKey, now.toString());

  // Perform check
  return checkAndProgressStage();
}

/**
 * Hook: Call after completing a weekly outcome
 */
export function onWeeklyOutcomeCompleted() {
  console.log(
    "🎯 [StageProgression] Weekly outcome completed - checking stage progression",
  );
  checkStageProgressionWithThreshold(true); // Force check
}

/**
 * Hook: Call after completing a milestone
 */
export function onMilestoneCompleted() {
  console.log(
    "🏆 [StageProgression] Milestone completed - checking stage progression",
  );
  checkStageProgressionWithThreshold(true); // Force check
}

/**
 * Hook: Call after completing a task (with throttle)
 */
export function onTaskCompleted() {
  // Tasks are completed more frequently, so use throttled check
  checkStageProgressionWithThreshold(false); // Throttled
}

/**
 * Hook: Call when team member is added
 */
export function onTeamMemberAdded() {
  console.log(
    "👥 [StageProgression] Team member added - checking stage progression",
  );
  checkStageProgressionWithThreshold(true); // Force check
}

/**
 * Hook: Call when metrics are updated (customers, revenue, etc.)
 */
export function onMetricsUpdated() {
  console.log(
    "📈 [StageProgression] Metrics updated - checking stage progression",
  );
  checkStageProgressionWithThreshold(true); // Force check
}

/**
 * Periodic check (call this on app load or dashboard mount)
 */
export function initializeStageProgressionCheck() {
  console.log(
    "🔄 [StageProgression] Initializing periodic stage progression check",
  );
  checkStageProgressionWithThreshold(false); // Throttled check on init

  // Set up periodic check every 5 minutes
  setInterval(
    () => {
      checkStageProgressionWithThreshold(false);
    },
    5 * 60 * 1000,
  ); // 5 minutes
}
