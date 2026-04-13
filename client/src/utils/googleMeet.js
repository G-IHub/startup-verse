/**
 * GOOGLE MEET UTILITIES
 * Helper functions for Google Meet integration
 */
import { toast } from "sonner";
import { API_BASE_URL } from "../config/apiBase.js";
import { getAccessToken } from "../app/session";

/**
 * Check if user has connected their Google account
 */
export async function isGoogleConnected(userId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/google/status/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      },
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.connected;
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
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      },
    );

    if (!response.ok) return { connected: false };

    return await response.json();
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
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
