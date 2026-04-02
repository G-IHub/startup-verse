/**
 * INTEGRATION EXAMPLE - How to use the new Weekly Outcome UX components
 *
 * This is a reference implementation showing how to integrate all the new
 * UX enhancement components into the FounderDashboard.
 *
 * DO NOT USE THIS FILE DIRECTLY - it's a reference guide only.
 */

import React, { useState, useEffect } from "react";
import { WeekTimeline } from "./components/execution-engine/WeekTimeline";
import { WeekHistoryPanel } from "./components/execution-engine/WeekHistoryPanel";
import { TaskWeekBadge } from "./components/execution-engine/TaskWeekBadge";
import { WeekCompletionCelebration } from "./components/execution-engine/WeekCompletionCelebration";
import { NewWeekEmptyState } from "./components/execution-engine/NewWeekEmptyState";

// ============================================================================
// STEP 1: Add state for tracking weeks and celebrations
// ============================================================================

function FounderDashboardExample() {
  const [currentOutcome, setCurrentOutcome] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [weekHistory, setWeekHistory] = useState([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedWeekData, setCompletedWeekData] = useState(null);

  // ============================================================================
  // STEP 2: Add helper functions for week calculations
  // ============================================================================

  // Calculate current week number
  const getCurrentWeekNumber = () => {
    // Count all completed outcomes + 1 for current
    const completedOutcomes = weekHistory.filter(
      (w) => w.outcome.status === "completed",
    ).length;
    return completedOutcomes + 1;
  };

  // Calculate how many weeks have been completed
  const getCompletedWeeksCount = () => {
    return weekHistory.filter((w) => w.outcome.status === "completed").length;
  };

  // Calculate current week's progress percentage
  const calculateCurrentWeekProgress = () => {
    if (!currentOutcome || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(
      (t) =>
        t.status === "completed" &&
        (t.outcomeId === currentOutcome.id ||
          t.weekId === currentOutcome.weekId),
    ).length;
    const currentOutcomeTasks = tasks.filter(
      (t) =>
        t.outcomeId === currentOutcome.id || t.weekId === currentOutcome.weekId,
    ).length;
    return currentOutcomeTasks > 0
      ? (completedTasks / currentOutcomeTasks) * 100
      : 0;
  };

  // Get last week's completion rate
  const getLastWeekCompletion = () => {
    const completedWeeks = weekHistory
      .filter((w) => w.outcome.status === "completed")
      .sort((a, b) => b.weekNumber - a.weekNumber);
    return completedWeeks.length > 0
      ? completedWeeks[0].completionRate
      : undefined;
  };

  // Get current week start date
  const getCurrentWeekStartDate = () => {
    if (currentOutcome?.weekId) {
      // Extract timestamp from weekId (format: "week-{timestamp}")
      const timestamp = parseInt(currentOutcome.weekId.replace("week-", ""));
      return new Date(timestamp);
    }
    return new Date(); // Fallback to today
  };

  // ============================================================================
  // STEP 3: Add handler for week completion
  // ============================================================================

  const handleWeekCompletion = async () => {
    if (!currentOutcome) return;

    // Calculate completion stats
    const currentOutcomeTasks = tasks.filter(
      (t) =>
        t.outcomeId === currentOutcome.id || t.weekId === currentOutcome.weekId,
    );
    const completedTasks = currentOutcomeTasks.filter(
      (t) => t.status === "completed",
    );
    const completedMilestones =
      currentOutcome.milestones?.filter((m) => m.status === "completed") || [];
    const totalMilestones = currentOutcome.milestones?.length || 0;
    const weekData = {
      weekNumber: getCurrentWeekNumber(),
      totalTasks: currentOutcomeTasks.length,
      completedTasks: completedTasks.length,
      totalMilestones: totalMilestones,
      completedMilestones: completedMilestones.length,
      completionRate:
        currentOutcomeTasks.length > 0
          ? (completedTasks.length / currentOutcomeTasks.length) * 100
          : 0,
      outcomeTitle: currentOutcome.title,
      startDate: getCurrentWeekStartDate(),
      endDate: new Date(), // Current date
    };
    setCompletedWeekData(weekData);
    setShowCompletionModal(true);

    // Mark outcome as completed
    const updatedOutcome = {
      ...currentOutcome,
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    // Save to backend
    // await coreEngineApi.updateWeeklyOutcome(userId, updatedOutcome);

    // Add to history
    const historyItem = {
      weekId: currentOutcome.weekId,
      weekNumber: getCurrentWeekNumber(),
      startDate: getCurrentWeekStartDate(),
      endDate: new Date(),
      outcome: {
        id: currentOutcome.id,
        title: currentOutcome.title,
        description: currentOutcome.description,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones.length,
      },
      tasks: {
        total: currentOutcomeTasks.length,
        completed: completedTasks.length,
      },
      completionRate: weekData.completionRate,
    };
    setWeekHistory((prev) => [historyItem, ...prev]);
    setCurrentOutcome(null); // Clear current outcome
  };

  // ============================================================================
  // STEP 4: Render the components in the dashboard
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {currentOutcome && (
        <WeekTimeline
          currentWeek={getCurrentWeekNumber()}
          totalWeeks={52}
          completedWeeks={getCompletedWeeksCount()}
          currentWeekProgress={calculateCurrentWeekProgress()}
          currentWeekStartDate={getCurrentWeekStartDate()}
        />
      )}
      {!currentOutcome && (
        <NewWeekEmptyState
          weekNumber={getCurrentWeekNumber()}
          lastWeekCompletion={getLastWeekCompletion()}
          onSetOutcome={() => {
            // Open intent capture modal
            // setShowIntentModal(true);
          }}
          onUseTemplate={() => {
            // Open outcome template selection modal
            // setShowOutcomeModal(true);
          }}
        />
      )}
      {currentOutcome && tasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Your Tasks</h3>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{task.title}</span>
                    <TaskWeekBadge
                      weekId={task.weekId}
                      weekNumber={getCurrentWeekNumber()}
                      variant="compact"
                    />
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                  )}
                </div>
                <div />
              </div>
            </div>
          ))}
        </div>
      )}
      {weekHistory.length > 0 && (
        <WeekHistoryPanel
          history={weekHistory}
          onViewWeek={(weekId) => {
            console.log("View week:", weekId);
            // Could open a modal showing archived week details
          }}
          maxItems={10}
        />
      )}
      {showCompletionModal && completedWeekData && (
        <WeekCompletionCelebration
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          weekNumber={completedWeekData.weekNumber}
          completionData={completedWeekData}
          onStartNewWeek={() => {
            setShowCompletionModal(false);
            // Show outcome selection modal or intent capture
            // setShowOutcomeModal(true);
          }}
        />
      )}
      {currentOutcome && (
        <button
          onClick={handleWeekCompletion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Complete Week & Review
        </button>
      )}
    </div>
  );
}

// ============================================================================
// STEP 5: Data Loading - Load history from backend on mount
// ============================================================================

// In useEffect:
useEffect(() => {
  async function loadWeekHistory() {
    // Load all completed outcomes from backend
    // const allOutcomes = await coreEngineApi.getWeeklyOutcomes(userId);
    // const completed = allOutcomes.filter(o => o.status === 'completed');
    // Transform to WeekHistoryItem format
    // const history = completed.map((outcome, index) => ({
    //   weekId: outcome.weekId,
    //   weekNumber: index + 1,
    //   startDate: new Date(outcome.createdAt),
    //   endDate: new Date(outcome.completedAt),
    //   outcome: {
    //     id: outcome.id,
    //     title: outcome.title,
    //     description: outcome.description,
    //     status: outcome.status,
    //     completedAt: outcome.completedAt
    //   },
    //   milestones: {
    //     total: outcome.milestones?.length || 0,
    //     completed: outcome.milestones?.filter(m => m.status === 'completed').length || 0
    //   },
    //   tasks: {
    //     total: 0, // Calculate from tasks
    //     completed: 0
    //   },
    //   completionRate: 0 // Calculate
    // }));
    // setWeekHistory(history);
  } // loadWeekHistory();
}, []); // ============================================================================
// NOTES FOR INTEGRATION
// ============================================================================
/**
 * 1. Install dependencies first:
 *    npm install react-confetti react-use
 *
 * 2. Import all components at the top of FounderDashboard.tsx
 *
 * 3. Add the helper functions to calculate week numbers and progress
 *
 * 4. Add state for tracking:
 *    - weekHistory (array of completed weeks)
 *    - showCompletionModal (boolean)
 *    - completedWeekData (celebration data)
 *
 * 5. Integrate components in appropriate places:
 *    - WeekTimeline at top of dashboard (when active outcome exists)
 *    - NewWeekEmptyState when no active outcome
 *    - TaskWeekBadge on each task item
 *    - WeekHistoryPanel in sidebar or separate tab
 *    - WeekCompletionCelebration triggered after completing weekly review
 *
 * 6. Update WeeklyReviewModal to trigger celebration:
 *    - After user completes review, call handleWeekCompletion()
 *    - This will show the celebration and add to history
 *
 * 7. Persist week history to backend:
 *    - Save completed outcomes with completedAt timestamp
 *    - Load history on dashboard mount
 *    - Calculate completion rates from task data
 */
