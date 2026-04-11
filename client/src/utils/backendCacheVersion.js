/**
 * Backend-driven cache invalidation
 *
 * Checks the backend for the current app version and invalidates cache
 * when the deployment version changes.
 */

import { checkBackendHealth } from "./backendHealthCheck";

// Local version key for tracking what version user has loaded
const LOCAL_VERSION_KEY = "startupverse_loaded_version";
const LAST_CHECK_KEY = "startupverse_version_check_timestamp";

// Check interval: 5 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Check backend for current version and invalidate cache if needed
 */
export async function checkBackendVersionAndInvalidate() {
  try {
    // Check if we've checked recently (avoid spam)
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();

    if (lastCheck && now - parseInt(lastCheck) < CHECK_INTERVAL_MS) {
      console.log("⏭️ Skipping version check (checked recently)");
      return false;
    }

    // Get backend health/version info
    const health = await checkBackendHealth();

    if (!health.online) {
      console.log("⚠️ Backend offline - skipping version check");
      return false;
    }

    const backendVersion = health.version || "1.0.0";
    const localVersion = localStorage.getItem(LOCAL_VERSION_KEY);

    console.log("🔍 Version check:", {
      backend: backendVersion,
      local: localVersion || "none",
    });

    // Update last check timestamp
    localStorage.setItem(LAST_CHECK_KEY, now.toString());

    if (localVersion !== backendVersion) {
      console.log("🔄 Backend version changed - invalidating cache");
      console.log(`   ${localVersion || "none"} → ${backendVersion}`);

      await invalidateCache();

      // Update local version
      localStorage.setItem(LOCAL_VERSION_KEY, backendVersion);

      // Show notification
      notifyUserOfUpdate(backendVersion);

      return true;
    }

    // Ensure local version is set (first run)
    if (!localVersion) {
      localStorage.setItem(LOCAL_VERSION_KEY, backendVersion);
    }

    return false;
  } catch (error) {
    console.error("❌ Failed to check backend version:", error);
    return false;
  }
}

/**
 * Invalidate all cached data
 */
async function invalidateCache() {
  console.log("🧹 Invalidating cached data...");

  // Keys that should be cleared on version updates
  const keysToInvalidate = [
    "cached_team_members",
    "cached_tasks",
    "cached_activities",
    "team_data_cache",
    "user_cache",
    "dashboard_cache",
    "milestone_cache",
    "task_cache",
  ];

  let clearedCount = 0;

  keysToInvalidate.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  // Clear any timestamped cache entries
  Object.keys(localStorage).forEach((key) => {
    if (key.includes("_cache_") || key.includes("_timestamp_")) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`✅ Cache cleared: ${clearedCount} items removed`);
}

/**
 * Show notification about update
 */
function notifyUserOfUpdate(version) {
  console.log(`📢 App updated to version ${version}`);

  // Show toast if available
  if (typeof window !== "undefined") {
    const toast = window.toast;
    if (toast) {
      toast.success(`🔒 Security update applied - cache refreshed`, {
        duration: 4000,
      });
    }
  }
}

/**
 * Force immediate cache clear (for emergency deployments)
 */
export async function forceInvalidateCache() {
  console.log("🚨 FORCE cache invalidation triggered");

  await invalidateCache();

  // Clear version tracking to force recheck
  localStorage.removeItem(LOCAL_VERSION_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);

  console.log("✅ Force invalidation complete");
}

/**
 * Main function to call on app startup
 */
export async function handleBackendVersionCheck() {
  console.log("🔍 Checking backend version...");

  try {
    const wasInvalidated = await checkBackendVersionAndInvalidate();

    if (wasInvalidated) {
      console.log("🔒 Security update detected and applied");
    } else {
      console.log("✅ App version up to date");
    }
  } catch (error) {
    console.error("❌ Backend version check failed:", error);
    // Don't block app loading
  }
}

/**
 * Set up periodic version checking (runs in background)
 */
export function startBackgroundVersionCheck() {
  // Check every 5 minutes
  setInterval(async () => {
    console.log("⏰ Background version check...");
    await checkBackendVersionAndInvalidate();
  }, CHECK_INTERVAL_MS);

  console.log("✅ Background version checking enabled (every 5 minutes)");
}

export default {
  checkBackendVersionAndInvalidate,
  forceInvalidateCache,
  handleBackendVersionCheck,
  startBackgroundVersionCheck,
};
