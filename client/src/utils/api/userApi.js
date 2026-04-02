const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Get user by ID (to refresh user data from backend)
export async function getUserById(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch user");
    }

    return data;
  } catch (error) {
    // Silently fail in development mode (expected when backend isn't running)
    if (process.env.NODE_ENV === "development") {
      console.debug("Backend API not available, using localStorage data");
    } else {
      console.error("Error fetching user:", error);
    }
    throw error;
  }
}

// Refresh current user from backend and update localStorage
export async function refreshCurrentUser(userId) {
  try {
    const result = await getUserById(userId);

    if (result.success && result.user) {
      // Update localStorage
      localStorage.setItem("startupverse_user", JSON.stringify(result.user));
      return result.user;
    }

    return null;
  } catch (error) {
    // Silently fail - the app will use cached localStorage data
    if (process.env.NODE_ENV === "development") {
      console.debug("Using cached user data from localStorage");
    } else {
      console.error("Error refreshing user:", error);
    }
    return null;
  }
}
