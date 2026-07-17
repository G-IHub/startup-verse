import { getResumeMaxBytes, isResumeScope } from "./resumeAttachments.js";
import { getAvatarMaxBytes, isAvatarScope } from "./avatarAttachments.js";

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const MESSAGES_MAX_BYTES = 40 * 1024 * 1024;

const MESSAGES_MIME_PREFIXES = ["image/", "video/"];
const MESSAGES_MIME_EXACT = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function getMaxUploadBytesForScope(scope) {
  const norm = typeof scope === "string" ? scope.trim().toLowerCase() : "";
  if (norm === "messages") return MESSAGES_MAX_BYTES;
  if (isResumeScope(norm)) return getResumeMaxBytes();
  if (isAvatarScope(norm)) return getAvatarMaxBytes();
  return DEFAULT_MAX_BYTES;
}

export function isAllowedMessagesMime(mimeType) {
  const mt = String(mimeType || "").toLowerCase().trim();
  if (!mt) return false;
  if (MESSAGES_MIME_PREFIXES.some((p) => mt.startsWith(p))) return true;
  return MESSAGES_MIME_EXACT.has(mt);
}

export function normalizeAttachments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === "object" && String(a.url || "").trim())
    .map((a) => ({
      url: String(a.url).trim(),
      fileName: typeof a.fileName === "string" ? a.fileName.slice(0, 255) : "",
      fileSize: Number.isFinite(Number(a.fileSize)) ? Number(a.fileSize) : 0,
      fileType: typeof a.fileType === "string" ? a.fileType.slice(0, 120) : "",
    }));
}

export function messageHasContent(body, attachments) {
  const text = String(body || "").trim();
  return Boolean(text) || (Array.isArray(attachments) && attachments.length > 0);
}
