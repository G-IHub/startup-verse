/**
 * Cache Invalidation Utility
 *
 * Forces cache clearing when critical security fixes are deployed.
 * This ensures users get the latest, secure version of data filtering logic.
 */

// Increment this version number whenever you deploy critical security fixes
const CURRENT_APP_VERSION = "1.0.2"; // Incremented for email delivery fix (custom domain support)
const VERSION_KEY = "startupverse_app_version";

/**
 * Check if cache needs to be invalidated and clear if necessary
 */
export function checkAndInvalidateCache() {
  const storedVersion = localStorage.getItem(VERSION_KEY);

  if (storedVersion !== CURRENT_APP_VERSION) {
    console.log("🔄 Cache invalidation triggered");
    console.log(`   Previous version: ${storedVersion || "none"}`);
    console.log(`   Current version: ${CURRENT_APP_VERSION}`);

    invalidateCache();

    // Update version
    localStorage.setItem(VERSION_KEY, CURRENT_APP_VERSION);

    return true;
  }

  return false;
}

/**
 * Force invalidate all cached data
 */
export function invalidateCache() {
  console.log("🧹 Invalidating cached data...");

  // Keys that should be cleared on security updates
  const keysToInvalidate = [
    // Don't clear these - they're user data:
    // 'startupverse_users' - Keep user records
    // 'startupverse_auth' - Keep auth data

    // Clear cached queries/filters:
    "cached_team_members",
    "cached_tasks",
    "cached_activities",
    "team_data_cache",
    "user_cache",
    "dashboard_cache",
  ];

  keysToInvalidate.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`   ✅ Cleared: ${key}`);
    }
  });

  // Clear any timestamped cache entries
  Object.keys(localStorage).forEach((key) => {
    if (key.includes("_cache_") || key.includes("_timestamp_")) {
      localStorage.removeItem(key);
      console.log(`   ✅ Cleared: ${key}`);
    }
  });

  console.log("✅ Cache invalidation complete");
}

/**
 * Force a full app refresh (hard reload)
 */
export function forceHardRefresh() {
  console.log("🔄 Forcing hard refresh...");
  window.location.reload();
}

/**
 * Show notification to user about cache clear
 */
export function notifyUserOfCacheClear() {
  console.log("📢 Cache was cleared due to security update");

  // You can add a toast notification here if needed
  if (typeof window !== "undefined" && window.toast) {
    window.toast.info("App updated - cache refreshed for security");
  }
}

/**
 * Main function to call on app startup
 */
export function handleAppVersionCheck() {
  const wasInvalidated = checkAndInvalidateCache();

  if (wasInvalidated) {
    notifyUserOfCacheClear();
    console.log("🔒 Security update applied - cache cleared");
  }
}

export default {
  checkAndInvalidateCache,
  invalidateCache,
  forceHardRefresh,
  notifyUserOfCacheClear,
  handleAppVersionCheck,
  CURRENT_APP_VERSION,
};
