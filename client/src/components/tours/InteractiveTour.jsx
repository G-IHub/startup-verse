import React, { useState, useEffect } from "react";
import { Joyride, STATUS, ACTIONS, EVENTS } from "react-joyride";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * @param {object} props
 * @param {boolean} [props.serverCompleted] When true, treat tour as completed for auto-start (with localStorage).
 * @param {boolean} [props.bypassPersistedGate] When true (e.g. replay), auto-start even if server says completed.
 * @param {boolean} [props.allowSkip=true] When false, first-visit: Skip does not persist completion.
 * @param {() => Promise<void>} [props.onPersistComplete] Called on FINISHED after successful flow; set localStorage after this resolves.
 */
export default function InteractiveTour({
  steps,
  tourKey,
  run = true,
  onComplete,
  continuous = true,
  showProgress = true,
  showSkipButton = true,
  serverCompleted = false,
  bypassPersistedGate = false,
  allowSkip = true,
  onPersistComplete,
}) {
  const [runTour, setRunTour] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const lsDone = localStorage.getItem(`tour_completed_${tourKey}`) === "true";
    const persistedComplete = Boolean(serverCompleted) || lsDone;
    const shouldAutoRun = run && (bypassPersistedGate || !persistedComplete);
    if (shouldAutoRun) {
      const t = setTimeout(() => {
        setRunTour(true);
      }, 500);
      return () => clearTimeout(t);
    }
    setRunTour(false);
    return undefined;
  }, [tourKey, run, serverCompleted, bypassPersistedGate]);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === STATUS.FINISHED) {
      void (async () => {
        try {
          if (onPersistComplete) {
            await onPersistComplete();
          }
          localStorage.setItem(`tour_completed_${tourKey}`, "true");
          setRunTour(false);
          onComplete?.();
        } catch (err) {
          console.error("[InteractiveTour] persist failed:", err);
          setRunTour(false);
        }
      })();
      return;
    }

    if (status === STATUS.SKIPPED) {
      if (allowSkip) {
        localStorage.setItem(`tour_completed_${tourKey}`, "true");
      }
      setRunTour(false);
      onComplete?.();
    }

    if (type === EVENTS.STEP_AFTER && data.action === ACTIONS.NEXT) {
      // reserved
    }
  };

  const isDark = theme === "dark";
  const joyrideShowSkip = showSkipButton && allowSkip;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={continuous}
      showProgress={showProgress}
      showSkipButton={joyrideShowSkip}
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
