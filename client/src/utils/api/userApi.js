import { persistCurrentUser } from "../../app/session";
import { API_BASE_URL } from "../../config/apiBase.js";
import { unwrapData } from "../apiEnvelope.js";
import { get } from "../backendClient.js";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif";

const AVATAR_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAllowedAvatarFile(file) {
  if (!file) return false;
  return AVATAR_MIME.has(String(file.type || "").toLowerCase());
}

/**
 * Upload a profile picture (multipart) via POST /users/upload-avatar.
 * Returns the sanitized user document with the new `avatarUrl`.
 */
export async function uploadAvatar(file) {
  if (!file) {
    throw new Error("An image file is required.");
  }
  if (!isAllowedAvatarFile(file)) {
    const err = new Error(
      "Avatar must be a JPEG, PNG, WebP, or GIF image.",
    );
    err.status = 400;
    throw err;
  }
  if (file.size > AVATAR_MAX_BYTES) {
    const err = new Error("Avatar must be 2MB or smaller.");
    err.status = 413;
    throw err;
  }

  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}/users/upload-avatar`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  let json = {};
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  if (!response.ok) {
    const err = new Error(
      json?.message || json?.error || "Failed to upload profile picture.",
    );
    err.status = response.status;
    throw err;
  }

  return unwrapData(json);
}

// Get user by ID (to refresh user data from backend)
export async function getUserById(userId) {
  try {
    const payload = await get(`/users/${userId}`);
    return { success: true, user: payload.data };
  } catch (error) {
    // Silently fail in development mode (expected when backend isn't running)
    if (process.env.NODE_ENV === "development") {
      console.debug("Backend API not available; using in-memory session only");
    } else {
      console.error("Error fetching user:", error);
    }
    throw error;
  }
}

// Refresh current user from backend and sync session
export async function refreshCurrentUser(userId) {
  try {
    const result = await getUserById(userId);

    if (result.success && result.user) {
      persistCurrentUser(result.user);
      return result.user;
    }

    return null;
  } catch (error) {
    // Silently fail — keep last known in-memory profile if refresh fails
    if (process.env.NODE_ENV === "development") {
      console.debug("Using last known user from session after refresh error");
    } else {
      console.error("Error refreshing user:", error);
    }
    return null;
  }
}
