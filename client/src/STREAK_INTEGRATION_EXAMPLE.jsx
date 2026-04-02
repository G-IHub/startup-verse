/**
 * EXAMPLE: How to Integrate Streak Polish Components into Founder Dashboard
 *
 * This file shows you exactly how to add the new streak features to your dashboard.
 * Copy the relevant parts into your FounderDashboard.tsx component.
 */

import React, { useState, useEffect } from "react";
import EnhancedWeeklyStreak from "./components/execution-engine/EnhancedWeeklyStreak";
import { StreakLeaderboard } from "./components/execution-engine/StreakLeaderboard";
import { StreakCelebration } from "./components/execution-engine/StreakCelebration";
import { formatStreakData, calculateWeekProgress } from "./utils/streakHelpers";
function ExampleFounderDashboard({ user }) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [executionData, setExecutionData] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [hasShownCelebrationThisWeek, setHasShownCelebrationThisWeek] =
    useState(false);

  // ============================================
  // LOAD EXECUTION DATA
  // ============================================

  useEffect(() => {
    // Load execution data from localStorage or API
    const data = JSON.parse(
      localStorage.getItem(`execution_data_${user.id}`) || "{}",
    );
    setExecutionData(data);
    setPreviousStreak(data.streak || 0);

    // Check if celebration was already shown this week
    const celebrationKey = `celebration_shown_week_${data.currentOutcome?.weekNumber}`;
    const shown = localStorage.getItem(celebrationKey);
    setHasShownCelebrationThisWeek(!!shown);
  }, [user.id]);

  // ============================================
  // DETECT WEEK COMPLETION & TRIGGER CELEBRATION
  // ============================================

  useEffect(() => {
    if (!executionData?.currentOutcome) return;
    const weekProgress = calculateWeekProgress(executionData.currentOutcome);
    const currentStreak = executionData.streak || 0;

    // Trigger celebration when week is complete AND streak increased
    if (
      weekProgress >= 100 &&
      currentStreak > previousStreak &&
      !hasShownCelebrationThisWeek
    ) {
      // Mark celebration as shown for this week
      const celebrationKey = `celebration_shown_week_${executionData.currentOutcome.weekNumber}`;
      localStorage.setItem(celebrationKey, "true");
      setShowCelebration(true);
      setHasShownCelebrationThisWeek(true);
      setPreviousStreak(currentStreak);
    }
  }, [executionData, previousStreak, hasShownCelebrationThisWeek]);

  // ============================================
  // CALCULATE STREAK DATA
  // ============================================

  const streakData = executionData ? formatStreakData(executionData) : null;
  const currentStage =
    executionData?.currentOutcome?.stage || "Idea & Validation";

  // ============================================
  // RENDER DASHBOARD
  // ============================================

  return (
    <div className="p-3 space-y-3">
      {streakData && (
        <EnhancedWeeklyStreak
          streak={streakData.currentStreak}
          hasPartialWeeks={false}
          currentStage={currentStage}
          weekProgress={streakData.weekProgress}
          daysLeftInWeek={streakData.daysUntilReset}
          isStreakAtRisk={streakData.isAtRisk}
          onViewLeaderboard={() => setShowLeaderboard(true)}
        />
      )}
      <div className="grid md:grid-cols-2 gap-3" />
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <StreakLeaderboard
              currentUser={user}
              onClose={() => setShowLeaderboard(false)}
            />
          </div>
        </div>
      )}
      <StreakCelebration
        isOpen={showCelebration}
        newStreak={executionData?.streak || 0}
        previousStreak={previousStreak}
        onClose={() => setShowCelebration(false)}
        onViewLeaderboard={() => {
          setShowCelebration(false);
          setShowLeaderboard(true);
        }}
        onShareAchievement={() => {
          // Optional: Share to social media or team
          const shareText = `🔥 Just completed my ${executionData?.streak}-week execution streak on StartupVerse! Consistency is key to startup success.`;

          // Example: Copy to clipboard
          navigator.clipboard.writeText(shareText);
          toast.success("Achievement copied! Share it with your network 🎉");
          setShowCelebration(false);
        }}
      />
    </div>
  );
}
export default ExampleFounderDashboard;

// ============================================
// ALTERNATIVE: MINIMAL INTEGRATION
// ============================================

/**
 * If you want a simpler integration without leaderboard/celebration,
 * just use this minimal version:
 */

function MinimalStreakIntegration({ user }) {
  const [executionData, setExecutionData] = useState(null);
  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem(`execution_data_${user.id}`) || "{}",
    );
    setExecutionData(data);
  }, [user.id]);
  const streakData = executionData ? formatStreakData(executionData) : null;
  if (!streakData) return null;
  return (
    <EnhancedWeeklyStreak
      streak={streakData.currentStreak}
      currentStage="Idea & Validation"
      weekProgress={streakData.weekProgress}
      daysLeftInWeek={streakData.daysUntilReset}
      isStreakAtRisk={streakData.isAtRisk}
    />
  );
}

// ============================================
// INTEGRATION NOTES
// ============================================

/**
 * IMPORTANT REMINDERS:
 *
 * 1. REPLACE OLD COMPONENT:
 *    Replace <WeeklyStreak /> with <EnhancedWeeklyStreak />
 *
 * 2. ADD DEPENDENCIES:
 *    Make sure you import:
 *    - EnhancedWeeklyStreak
 *    - StreakLeaderboard (optional)
 *    - StreakCelebration (optional)
 *    - formatStreakData, calculateWeekProgress
 *
 * 3. STATE MANAGEMENT:
 *    - Track previousStreak to detect increases
 *    - Track hasShownCelebrationThisWeek to avoid duplicates
 *    - Store celebration shown flag in localStorage
 *
 * 4. CELEBRATION TRIGGER:
 *    Celebration should trigger when:
 *    - weekProgress >= 100 (week complete)
 *    - currentStreak > previousStreak (streak increased)
 *    - !hasShownCelebrationThisWeek (not already shown)
 *
 * 5. LEADERBOARD:
 *    Can be triggered from:
 *    - Streak component button
 *    - Celebration modal
 *    - Navigation menu
 *    - Anywhere you want!
 *
 * 6. STYLING:
 *    Components use your existing design system:
 *    - Card, Button, Badge components
 *    - Dark mode support
 *    - Tailwind classes
 *    - No additional CSS needed
 *
 * 7. RESPONSIVE:
 *    All components are fully responsive
 *    Test on mobile, tablet, desktop
 *
 * 8. BACKWARD COMPATIBILITY:
 *    Keep the old WeeklyStreak.tsx file
 *    In case you need to roll back
 */

// ============================================
// TESTING SCENARIOS
// ============================================

/**
 * TEST CASES TO VERIFY:
 *
 * 1. New User (Streak = 0):
 *    - Should show "Start your first streak"
 *    - No warnings
 *    - Info tooltip visible
 *
 * 2. First Week Complete (Streak = 1):
 *    - Celebration triggers
 *    - "First Steps" badge
 *    - Confetti animation
 *
 * 3. Building Streak (Streak = 3):
 *    - "BUILDING" tier badge
 *    - Blue color scheme
 *    - Celebration with milestone message
 *
 * 4. Streak at Risk:
 *    - 2 days left + 30% progress
 *    - Critical warning shows
 *    - Red alert color
 *    - Warning message pulsing
 *
 * 5. Leaderboard:
 *    - Global tab shows top 50
 *    - Team tab shows startup members
 *    - Current user highlighted
 *    - Personal stats correct
 *
 * 6. Milestone Achievements:
 *    - Test 1, 3, 5, 10, 20, 50 week celebrations
 *    - Each has unique message
 *    - Correct tier badge
 *    - Proper quote attribution
 */
