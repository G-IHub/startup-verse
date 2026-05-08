import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../../../components/ui/use-mobile";

const PANEL_KEYS = ["chat", "tasks", "updates", "calendar"];

export function useOfficePanels() {
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = useState(null);
  const [desktopPanels, setDesktopPanels] = useState({
    chat: false,
    tasks: false,
    updates: false,
    calendar: false,
  });

  const closeAll = useCallback(() => {
    setMobileSheet(null);
    setDesktopPanels({
      chat: false,
      tasks: false,
      updates: false,
      calendar: false,
    });
  }, []);

  const openPanel = useCallback(
    (panelKey) => {
      if (!PANEL_KEYS.includes(panelKey)) return;
      if (isMobile) {
        setMobileSheet(panelKey);
        return;
      }
      setDesktopPanels((previous) => ({
        ...previous,
        [panelKey]: true,
        ...(panelKey === "chat" ? { updates: false } : {}),
        ...(panelKey === "updates" ? { chat: false } : {}),
      }));
    },
    [isMobile],
  );

  const closePanel = useCallback(
    (panelKey) => {
      if (!panelKey) {
        closeAll();
        return;
      }
      if (isMobile) {
        setMobileSheet((current) => (current === panelKey ? null : current));
        return;
      }
      setDesktopPanels((previous) => ({ ...previous, [panelKey]: false }));
    },
    [closeAll, isMobile],
  );

  const isOpen = useCallback(
    (panelKey) =>
      isMobile ? mobileSheet === panelKey : Boolean(desktopPanels[panelKey]),
    [desktopPanels, isMobile, mobileSheet],
  );

  useEffect(() => {
    if (isMobile) {
      setDesktopPanels({
        chat: false,
        tasks: false,
        updates: false,
        calendar: false,
      });
      return;
    }
    setMobileSheet(null);
  }, [isMobile]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const activeTag = event.target?.tagName?.toLowerCase();
      const isTypingTarget =
        activeTag === "input" ||
        activeTag === "textarea" ||
        event.target?.isContentEditable;

      if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        closeAll();
        return;
      }

      if (event.key.toLowerCase() === "c") {
        openPanel("chat");
      } else if (event.key.toLowerCase() === "t") {
        openPanel("tasks");
      } else if (event.key.toLowerCase() === "u") {
        openPanel("updates");
      } else if (event.key.toLowerCase() === "k") {
        openPanel("calendar");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAll, openPanel]);

  const actions = useMemo(
    () => [
      { id: "team-call", panel: "calendar", label: "Team Call", shortKey: "K" },
      { id: "chat", panel: "chat", label: "Chat", shortKey: "C" },
      { id: "tasks", panel: "tasks", label: "Tasks", shortKey: "T" },
      { id: "calendar", panel: "calendar", label: "Calendar", shortKey: "K" },
      { id: "updates", panel: "updates", label: "Updates", shortKey: "U" },
    ],
    [],
  );

  return {
    isMobile,
    mobileSheet,
    actions,
    isOpen,
    openPanel,
    closePanel,
    closeAll,
  };
}
