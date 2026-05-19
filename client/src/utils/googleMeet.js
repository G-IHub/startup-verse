/**
 * Google Meet helpers (status + instant meeting when OAuth is configured).
 */
import { toast } from "sonner";
import { API_BASE_URL } from "../config/apiBase.js";

const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

function unwrapStatusData(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    payload.success === true &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }
  return payload?.data ?? payload ?? {};
}

/**
 * True when server reports OAuth is wired and user is connected (not placeholder).
 */
export async function isGoogleConnected(userId) {
  const status = await getGoogleConnectionStatus(userId);
  return Boolean(status.connected);
}

/** Full status from GET /google/status/:userId */
export async function getGoogleConnectionStatus(userId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/google/status/${userId}`,
      defaultOptions,
    );

    if (!response.ok) return { connected: false, meetAvailable: false };

    const data = unwrapStatusData(await response.json());
    const enabled = data.enabled === true;
    const placeholder = data.placeholder === true;
    const meetAvailable = enabled && !placeholder;
    return {
      ...data,
      meetAvailable,
      connected: meetAvailable && Boolean(data.connected),
    };
  } catch (error) {
    console.error("Error getting Google status:", error);
    return { connected: false, meetAvailable: false };
  }
}

/**
 * Instant Meet (Virtual Office / Mentor portal).
 */
export async function createInstantGoogleMeet(userId, roomName) {
  const status = await getGoogleConnectionStatus(userId);
  if (!status.meetAvailable) {
    return {
      success: false,
      error: status.message || "Google Meet is not available on this server yet.",
    };
  }
  if (!status.connected) {
    return {
      success: false,
      error: "Connect your Google account before starting a meeting.",
    };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/google/instant-meeting/${userId}`,
      {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify({
          title: roomName || "StartupVerse Meeting",
          roomName: roomName || undefined,
        }),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        "Instant Google Meet failed.";
      return { success: false, error: message };
    }

    const data = unwrapStatusData(payload);
    const meetLink = data.meetLink || data.meetingUrl || "";
    if (!meetLink) {
      return { success: false, error: "No Meet link returned from server." };
    }
    return { success: true, meetLink, eventId: data.eventId || null };
  } catch (error) {
    console.error("Error creating instant Google Meet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function ensureGoogleConnected(userId) {
  const status = await getGoogleConnectionStatus(userId);
  if (!status.meetAvailable) {
    toast.error("Google Meet is not available on this server yet", {
      description: status.message || "OAuth integration is not configured.",
      duration: 5000,
    });
    return false;
  }
  if (!status.connected) {
    toast.error("Please connect your Google account first", {
      description:
        "Open settings and connect Google Calendar for meeting links.",
      duration: 5000,
    });
    return false;
  }
  return true;
}

export function openGoogleMeet(meetLink) {
  window.open(meetLink, "_blank", "noopener,noreferrer");
}
