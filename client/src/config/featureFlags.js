function isEnabled(value, defaultValue = true) {
  if (value === undefined) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(normalized);
}

export const featureFlags = {
  redesignedFounderHome: isEnabled(
    import.meta.env.VITE_UI_REDESIGN_FOUNDER_HOME,
    false,
  ),
};
