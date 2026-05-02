/**
 * Auth API Client
 * Handles authentication and account management
 */

import { API_BASE_URL } from "../../config/apiBase.js";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Delete user account
 * Permanently deletes the user account and all associated data
 */
export async function deleteAccount(userId) {
  try {
    const response = await fetch(`${API_BASE}/auth/account/${userId}`, {
      ...defaultOptions,
      method: "DELETE",
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
