import { API_BASE_URL } from "../config/apiBase.js";
import { normalizePresenceRow } from "../domains/presence/presenceModel.js";

const API_URL = API_BASE_URL;
const HEARTBEAT_MS = 25_000;

const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

function toClientPresence(raw) {
  return normalizePresenceRow(raw);
}

export async function updatePresence({
  userId,
  startupId,
  userName = "",
  role = "",
  isOnline = true,
  statusText = "",
  mood = "",
  activity = null,
  cameraEnabled = false,
}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_URL}/presence/update`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify({
        userId,
        startupId,
        userName,
        role,
        isOnline,
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
    if (error instanceof Error && error.name !== "AbortError") {
      console.debug("Presence update skipped (non-critical):", error.message);
    }
    return { success: false, error: "Network error while updating presence" };
  }
}

function sendOfflineBeacon(userId, startupId) {
  const body = JSON.stringify({
    userId,
    startupId,
    isOnline: false,
  });
  const url = `${API_URL}/presence/update`;
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }
  void fetch(url, {
    ...defaultOptions,
    method: "POST",
    body,
    keepalive: true,
  }).catch(() => {});
}

export async function getActiveUsers(startupId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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

export async function removePresence(userId, startupId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
    if (error instanceof Error && error.name !== "AbortError") {
      console.debug("Removing presence skipped (non-critical):", error.message);
    }
    return { success: false, error: "Network error while removing presence" };
  }
}

export function startPresenceHeartbeat(userId, startupId, getStatus) {
  const send = () => {
    const statusData = getStatus();
    void updatePresence({
      userId,
      startupId,
      isOnline: true,
      ...statusData,
    });
  };

  send();

  const intervalId = setInterval(send, HEARTBEAT_MS);

  const onPageHide = () => {
    sendOfflineBeacon(userId, startupId);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", onPageHide);
  }

  return () => {
    clearInterval(intervalId);
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", onPageHide);
    }
    // Intentionally no offline POST on React cleanup — avoids flash offline on
    // remount/strict mode; pagehide + server staleness handle real disconnect.
  };
}

export async function updateMyPresenceStatus(userId, startupId, statusText, mood = "") {
  return updatePresence({
    userId,
    startupId,
    statusText,
    mood,
    isOnline: true,
  });
}
