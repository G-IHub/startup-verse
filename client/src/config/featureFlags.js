function isEnabled(value, defaultValue = true) {
  if (value === undefined) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(normalized);
}

/** Master gate: when false, all per-area UI redesign flags are off. */
const uiRedesignMaster = isEnabled(import.meta.env.VITE_UI_REDESIGN, false);

function areaFlag(envValue) {
  return uiRedesignMaster && isEnabled(envValue, false);
}

/** Per-area rollout flags (ui-plan §7). All default off unless master + area env are set. */
export const uiRedesign = {
  enabled: uiRedesignMaster,
  shell: areaFlag(import.meta.env.VITE_UI_REDESIGN_SHELL),
  founderHome: areaFlag(import.meta.env.VITE_UI_REDESIGN_FOUNDER_HOME),
  virtualOffice: areaFlag(import.meta.env.VITE_UI_REDESIGN_VIRTUAL_OFFICE),
  teamMember: areaFlag(import.meta.env.VITE_UI_REDESIGN_TEAM_MEMBER),
  talent: areaFlag(import.meta.env.VITE_UI_REDESIGN_TALENT),
  inbox: areaFlag(import.meta.env.VITE_UI_REDESIGN_INBOX),
  analyticsSettings: areaFlag(import.meta.env.VITE_UI_REDESIGN_ANALYTICS_SETTINGS),
};

const UI_REDESIGN_AREAS = Object.freeze({
  shell: "shell",
  founderHome: "founderHome",
  virtualOffice: "virtualOffice",
  teamMember: "teamMember",
  talent: "talent",
  inbox: "inbox",
  analyticsSettings: "analyticsSettings",
});

/**
 * @param {keyof typeof UI_REDESIGN_AREAS} area
 * @returns {boolean}
 */
export function isUiRedesignEnabled(area) {
  return Boolean(uiRedesign[area]);
}

/** @deprecated Use uiRedesign.founderHome or isUiRedesignEnabled("founderHome") */
export const featureFlags = {
  redesignedFounderHome: uiRedesign.founderHome,
};
