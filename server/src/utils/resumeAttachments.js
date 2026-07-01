export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

const RESUME_MIME_EXACT = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function getResumeMaxBytes() {
  return RESUME_MAX_BYTES;
}

export function isAllowedResumeMime(mimeType) {
  const mt = String(mimeType || "").toLowerCase().trim();
  return RESUME_MIME_EXACT.has(mt);
}

export function isResumeScope(scope) {
  return String(scope || "").trim().toLowerCase() === "resumes";
}
