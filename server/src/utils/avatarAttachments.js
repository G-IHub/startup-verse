export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const AVATAR_MIME_EXACT = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function getAvatarMaxBytes() {
  return AVATAR_MAX_BYTES;
}

export function isAvatarScope(scope) {
  return String(scope || "").trim().toLowerCase() === "avatars";
}

export function isAllowedAvatarMime(mimeType) {
  const mt = String(mimeType || "").toLowerCase().trim();
  return AVATAR_MIME_EXACT.has(mt);
}
