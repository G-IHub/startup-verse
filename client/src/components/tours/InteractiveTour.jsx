import React, { useState, useEffect } from "react";
import Joyride, { STATUS, ACTIONS, EVENTS } from "react-joyride";
import { useTheme } from "../../contexts/ThemeContext";
export default function InteractiveTour({
  steps,
  tourKey,
  run = true,
  onComplete,
  continuous = true,
  showProgress = true,
  showSkipButton = true,
}) {
  const [runTour, setRunTour] = useState(false);
  const { theme } = useTheme();
  useEffect(() => {
    // Check if user has completed this tour
    const hasCompletedTour = localStorage.getItem(`tour_completed_${tourKey}`);
    if (!hasCompletedTour && run) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        setRunTour(true);
      }, 500);
    }
  }, [tourKey, run]);
  const handleJoyrideCallback = (data) => {
    const { status, action, index, type } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Mark tour as completed
      localStorage.setItem(`tour_completed_${tourKey}`, "true");
      setRunTour(false);
      if (onComplete) {
        onComplete();
      }
    }

    // Handle specific events if needed
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      // User clicked next
    }
  };
  const isDark = theme === "dark";
  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={continuous}
      showProgress={showProgress}
      showSkipButton={showSkipButton}
      callback={handleJoyrideCallback}
      scrollToFirstStep={true}
      scrollOffset={100}
      disableOverlayClose={true}
      spotlightClicks={true}
      styles={{
        options: {
          arrowColor: isDark ? "#1f2937" : "#ffffff",
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          primaryColor: "#3A5AFE",
          textColor: isDark ? "#f9fafb" : "#1f2937",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "8px",
        },
        tooltipContent: {
          fontSize: "14px",
          lineHeight: "1.6",
          padding: "8px 0",
        },
        buttonNext: {
          backgroundColor: "#3A5AFE",
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: "14px",
        },
        buttonBack: {
          color: isDark ? "#9ca3af" : "#6b7280",
          marginRight: 8,
        },
        buttonSkip: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
