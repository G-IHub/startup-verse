/**
 * Migration utility to fix organization invitation keys
 *
 * This migration moves organization invitations from the old key prefix
 * `founder:${founderId}:invitation:` to the new prefix `founder:${founderId}:org-invitation:`
 *
 * This fixes the issue where organization invitations were incorrectly appearing
 * in the "Sent" tab instead of only in the "Received" tab.
 */

import { API_BASE_URL } from "../../config/apiBase.js";

const BASE_URL = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export async function runOrgInvitationMigration() {
  try {
    console.log("🚀 [Migration] Starting organization invitation migration...");

    const response = await fetch(`${BASE_URL}/migrations/fix-org-invitations`, {
      ...defaultOptions,
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ [Migration] Migration failed:", error);
      throw new Error(error.error || "Migration failed");
    }

    const result = await response.json();
    console.log("✅ [Migration] Migration completed successfully:", result);

    return result;
  } catch (error) {
    console.error("❌ [Migration] Error running migration:", error);
    return {
      success: false,
      migrated: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
