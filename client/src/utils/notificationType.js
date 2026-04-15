export function normalizeNotificationType(type) {
  const raw = String(type || "").trim();
  if (!raw) return "general";
  return raw.replace(/_/g, "-").toLowerCase();
}

