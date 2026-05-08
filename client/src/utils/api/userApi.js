import { persistCurrentUser } from "../../app/session";
import { get } from "../backendClient.js";

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
