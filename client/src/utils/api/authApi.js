/**
 * Auth API Client
 * Handles authentication and account management
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Delete user account
 * Permanently deletes the user account and all associated data
 */
export async function deleteAccount(userId) {
  try {
    const response = await fetch(`${API_BASE}/auth/account/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to delete account:", data.error);
      return {
        success: false,
        error: data.error || "Failed to delete account",
      };
    }

    console.log("✅ Account deleted successfully");
    return {
      success: true,
      message: data.message || "Account deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}
