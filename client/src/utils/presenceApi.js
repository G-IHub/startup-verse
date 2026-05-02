import { API_BASE_URL } from "../config/apiBase.js";

const API_URL = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

function toClientPresence(raw) {
  if (!raw || typeof raw !== "object") return null;
  const statusText = String(raw.statusText || "");
  const metadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const activity = metadata.lastFeedActivity || null;
  const status = raw.isOnline ? "available" : "away";
  return {
    id: String(raw.userId || raw.id || ""),
    userId: String(raw.userId || raw.id || ""),
    startupId: String(raw.startupId || ""),
    name: String(raw.userName || ""),
    role: String(raw.role || ""),
    isOnline: Boolean(raw.isOnline),
    status,
    statusText,
    mood: String(raw.mood || ""),
    activity,
    cameraEnabled: Boolean(metadata.cameraEnabled),
    lastSeenAt: raw.lastSeenAt ? new Date(raw.lastSeenAt) : new Date(),
  };
}

// Update user presence
export async function updatePresence({
  userId,
  startupId,
  userName = "",
  role = "",
  isOnline = true,
  status = "available",
  statusText = "",
  mood = "",
  activity = null,
  cameraEnabled = false,
}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_URL}/presence/update`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify({
        userId,
        startupId,
        userName,
        role,
        isOnline,
        status,
        statusText,
        mood,
        activity,
        metadata: { cameraEnabled: Boolean(cameraEnabled) },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Failed to update presence:", error);
      return {
        success: false,
        error: error.error || "Failed to update presence",
      };
    }

    const payload = await response.json();
    return { success: true, presence: toClientPresence(payload?.data) };
  } catch (error) {
    // Silently fail for presence updates - non-critical feature
    // Only log in development to avoid console spam
    if (error instanceof Error && error.name !== "AbortError") {
      console.debug("Presence update skipped (non-critical):", error.message);
    }
    return { success: false, error: "Network error while updating presence" };
  }
}

// Get all active users for a startup
export async function getActiveUsers(startupId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_URL}/presence/${startupId}`, {
      ...defaultOptions,
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Failed to fetch active users:", error);
      return {
        success: false,
        error: error.error || "Failed to fetch active users",
      };
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const mapped = rows.map((row) => toClientPresence(row)).filter(Boolean);
    return { success: true, presence: mapped, count: mapped.length };
  } catch (error) {
    // Silently fail for presence fetching - non-critical feature
    if (error instanceof Error && error.name !== "AbortError") {
      console.debug(
        "Fetching active users skipped (non-critical):",
        error.message,
      );
    }
    return {
      success: false,
      error: "Network error while fetching active users",
    };
  }
}

// Remove user presence (on logout/offline)
export async function removePresence(userId, startupId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_URL}/presence/${startupId}/${userId}`, {
      ...defaultOptions,
      method: "DELETE",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Failed to remove presence:", error);
      return {
        success: false,
        error: error.error || "Failed to remove presence",
      };
    }

    return { success: true };
  } catch (error) {
    // Silently fail for presence removal - non-critical feature
    if (error instanceof Error && error.name !== "AbortError") {
      console.debug("Removing presence skipped (non-critical):", error.message);
    }
    return { success: false, error: "Network error while removing presence" };
  }
}

// Heartbeat - Send periodic presence updates
export function startPresenceHeartbeat(userId, startupId, getStatus) {
  // Send initial presence
  const statusData = getStatus();
  updatePresence({ userId, startupId, ...statusData });

  // Set up heartbeat interval (every 30 seconds)
  const intervalId = setInterval(() => {
    const statusData = getStatus();
    updatePresence({ userId, startupId, ...statusData });
  }, 30000); // 30 seconds

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    removePresence(userId, startupId);
  };
}

export async function updateMyPresenceStatus(userId, startupId, statusText, mood = "") {
  return updatePresence({
    userId,
    startupId,
    statusText,
    mood,
  });
}
