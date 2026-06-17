const SIDE_PANEL_COLLAPSED_KEY = "sv_call_side_panel_collapsed";

export function readSidePanelCollapsed() {
  try {
    const raw = localStorage.getItem(SIDE_PANEL_COLLAPSED_KEY);
    if (raw === null) return false;
    return raw === "true";
  } catch {
    return false;
  }
}

export function writeSidePanelCollapsed(collapsed) {
  try {
    localStorage.setItem(SIDE_PANEL_COLLAPSED_KEY, collapsed ? "true" : "false");
  } catch {
    // Ignore quota / private mode errors.
  }
}
