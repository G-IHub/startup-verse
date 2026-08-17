export const WORK_LOG_MAX_BYTES = 5 * 1024 * 1024;

const WORK_LOG_MIME_EXACT = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function getWorkLogMaxBytes() {
  return WORK_LOG_MAX_BYTES;
}

export function isWorkLogScope(scope) {
  return String(scope || "").trim().toLowerCase() === "work-log";
}

export function isAllowedWorkLogMime(mimeType) {
  const mt = String(mimeType || "").toLowerCase().trim();
  return WORK_LOG_MIME_EXACT.has(mt);
}
