/**
 * GOOGLE MEET UTILITIES
 * Helper functions for Google Meet integration
 */
import { toast } from "sonner";
import { API_BASE_URL } from "../config/apiBase.js";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Check if user has connected their Google account
 */
export async function isGoogleConnected(userId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/google/status/${userId}`,
      defaultOptions,
    );

    if (!response.ok) return false;

    const payload = await response.json();
    const data = payload?.data || {};
    return data.enabled === true && data.connected === true;
  } catch (error) {
    console.error("Error checking Google connection:", error);
    return false;
  }
}

/**
 * Get Google connection details
 */
export async function getGoogleConnectionStatus(userId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/google/status/${userId}`,
      defaultOptions,
    );

    if (!response.ok) return { connected: false };

    const payload = await response.json();
    return payload?.data || { connected: false };
  } catch (error) {
    console.error("Error getting Google status:", error);
    return { connected: false };
  }
}

/**
 * Create a scheduled Google Meet link
 */
export async function createGoogleMeet(params) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/google/create-meeting`,
      {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify(params),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create meeting");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Google Meet:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create meeting",
    };
  }
}

/**
 * Create an instant Google Meet link (for Virtual Office)
 */
export async function createInstantGoogleMeet(userId, roomName) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/google/instant-meeting/${userId}`,
      {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify({ roomName }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create instant meeting");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating instant Google Meet:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create instant meeting",
    };
  }
}

/**
 * Prompt user to connect Google if not connected
 */
export async function ensureGoogleConnected(userId, userType) {
  const connected = await isGoogleConnected(userId);

  if (!connected) {
    toast.error("Please connect your Google account first", {
      description:
        "Go to Settings to connect your Google Calendar for automatic meeting links",
      duration: 5000,
    });
    return false;
  }

  return true;
}

/**
 * Open Google Meet in new window
 */
export function openGoogleMeet(meetLink) {
  window.open(meetLink, "_blank", "noopener,noreferrer");
}
