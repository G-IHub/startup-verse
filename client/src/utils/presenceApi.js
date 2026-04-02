const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Update user presence
export async function updatePresence(
  userId,
  startupId,
  status,
  activity,
  cameraEnabled,
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_URL}/presence/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify({
        userId,
        startupId,
        status,
        activity,
        cameraEnabled: cameraEnabled || false,
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

    const data = await response.json();
    return { success: true, presence: data.presence };
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
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
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

    const data = await response.json();
    return { success: true, presence: data.presence, count: data.count };
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
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
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
  updatePresence(
    userId,
    startupId,
    statusData.status,
    statusData.activity,
    statusData.cameraEnabled,
  );

  // Set up heartbeat interval (every 30 seconds)
  const intervalId = setInterval(() => {
    const statusData = getStatus();
    updatePresence(
      userId,
      startupId,
      statusData.status,
      statusData.activity,
      statusData.cameraEnabled,
    );
  }, 30000); // 30 seconds

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    removePresence(userId, startupId);
  };
}
