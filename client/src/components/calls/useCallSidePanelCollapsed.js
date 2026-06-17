import { useCallback, useState } from "react";
import {
  readSidePanelCollapsed,
  writeSidePanelCollapsed,
} from "../../utils/callSidePanelStorage";

export function useCallSidePanelCollapsed() {
  const [collapsed, setCollapsed] = useState(() => readSidePanelCollapsed());

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeSidePanelCollapsed(next);
      return next;
    });
  }, []);

  const setCollapsedPersisted = useCallback((value) => {
    setCollapsed(value);
    writeSidePanelCollapsed(value);
  }, []);

  return {
    collapsed,
    toggleCollapsed,
    setCollapsed: setCollapsedPersisted,
  };
}
