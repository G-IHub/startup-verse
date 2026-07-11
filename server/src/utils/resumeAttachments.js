export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

const RESUME_MIME_EXACT = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const GENERIC_UPLOAD_MIME = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

export function getResumeMaxBytes() {
  return RESUME_MAX_BYTES;
}

export function isAllowedResumeMime(mimeType) {
  const mt = String(mimeType || "").toLowerCase().trim();
  return RESUME_MIME_EXACT.has(mt);
}

export function inferResumeMimeType(mimeType, fileName) {
  const mt = String(mimeType || "").toLowerCase().trim();
  if (isAllowedResumeMime(mt)) return mt;
  if (!GENERIC_UPLOAD_MIME.has(mt)) return mt;

  const lowerName = String(fileName || "").toLowerCase().trim();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return mt;
}

export function isResumeScope(scope) {
  return String(scope || "").trim().toLowerCase() === "resumes";
}
