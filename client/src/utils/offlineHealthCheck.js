/**
 * Offline Capabilities Health Check
 * Verifies all offline features are working correctly
 */

import { offlineStorage } from "./offlineStorage";
import { isServiceWorkerActive } from "./serviceWorkerManager";

/**
 * Run health check for offline capabilities
 */
export async function runOfflineHealthCheck() {
  const status = {
    serviceWorker: {
      supported: false,
      active: false,
      status: "error",
      message: "",
    },
    indexedDB: {
      supported: false,
      initialized: false,
      status: "error",
      message: "",
    },
    cacheAPI: {
      supported: false,
      status: "error",
      message: "",
    },
    backgroundSync: {
      supported: false,
      status: "warning",
      message: "",
    },
    overall: "error",
  };

  // Check Service Worker
  if ("serviceWorker" in navigator) {
    status.serviceWorker.supported = true;
    status.serviceWorker.active = isServiceWorkerActive();

    if (status.serviceWorker.active) {
      status.serviceWorker.status = "ok";
      status.serviceWorker.message = "Service Worker active and running";
    } else {
      status.serviceWorker.status = "warning";
      status.serviceWorker.message =
        "Service Worker supported but not active yet";
    }
  } else {
    status.serviceWorker.status = "error";
    status.serviceWorker.message =
      "Service Workers not supported in this browser";
  }

  // Check IndexedDB
  if ("indexedDB" in window) {
    status.indexedDB.supported = true;

    try {
      await offlineStorage.init();
      status.indexedDB.initialized = true;
      status.indexedDB.status = "ok";
      status.indexedDB.message = "IndexedDB initialized successfully";
    } catch (error) {
      status.indexedDB.status = "error";
      status.indexedDB.message = `IndexedDB initialization failed: ${error}`;
    }
  } else {
    status.indexedDB.status = "error";
    status.indexedDB.message = "IndexedDB not supported in this browser";
  }

  // Check Cache API
  if ("caches" in window) {
    status.cacheAPI.supported = true;
    status.cacheAPI.status = "ok";
    status.cacheAPI.message = "Cache API available";
  } else {
    status.cacheAPI.status = "warning";
    status.cacheAPI.message =
      "Cache API not supported (offline assets won't be cached)";
  }

  // Check Background Sync
  if (
    "serviceWorker" in navigator &&
    "sync" in ServiceWorkerRegistration.prototype
  ) {
    status.backgroundSync.supported = true;
    status.backgroundSync.status = "ok";
    status.backgroundSync.message =
      "Background Sync supported (automatic sync enabled)";
  } else {
    status.backgroundSync.supported = false;
    status.backgroundSync.status = "warning";
    status.backgroundSync.message =
      "Background Sync not supported (manual sync will be used)";
  }

  // Determine overall status
  const hasErrors = Object.values(status).some(
    (s) => typeof s === "object" && s.status === "error",
  );
  const hasWarnings = Object.values(status).some(
    (s) => typeof s === "object" && s.status === "warning",
  );

  // Critical check: IndexedDB MUST work
  if (status.indexedDB.status === "error") {
    status.overall = "error";
  } else if (hasWarnings) {
    status.overall = "warning";
  } else {
    status.overall = "ok";
  }

  return status;
}

/**
 * Log health check results to console
 */
export async function logOfflineHealthCheck() {
  console.log("🔍 Running Offline Capabilities Health Check...");
  console.log("================================================");

  const status = await runOfflineHealthCheck();

  // Service Worker
  const swIcon =
    status.serviceWorker.status === "ok"
      ? "✅"
      : status.serviceWorker.status === "warning"
        ? "⚠️"
        : "❌";
  console.log(`${swIcon} Service Worker: ${status.serviceWorker.message}`);

  // IndexedDB
  const idbIcon =
    status.indexedDB.status === "ok"
      ? "✅"
      : status.indexedDB.status === "warning"
        ? "⚠️"
        : "❌";
  console.log(`${idbIcon} IndexedDB: ${status.indexedDB.message}`);

  // Cache API
  const cacheIcon =
    status.cacheAPI.status === "ok"
      ? "✅"
      : status.cacheAPI.status === "warning"
        ? "⚠️"
        : "❌";
  console.log(`${cacheIcon} Cache API: ${status.cacheAPI.message}`);

  // Background Sync
  const syncIcon =
    status.backgroundSync.status === "ok"
      ? "✅"
      : status.backgroundSync.status === "warning"
        ? "⚠️"
        : "❌";
  console.log(`${syncIcon} Background Sync: ${status.backgroundSync.message}`);

  console.log("================================================");

  // Overall status
  if (status.overall === "ok") {
    console.log("✅ OVERALL: All offline features working perfectly!");
  } else if (status.overall === "warning") {
    console.log("⚠️ OVERALL: Offline features working with some limitations");
  } else {
    console.log("❌ OVERALL: Critical offline features not available");
  }

  console.log("================================================");
}

/**
 * Get user-friendly health check summary
 */
export async function getOfflineHealthSummary() {
  const status = await runOfflineHealthCheck();

  if (status.overall === "ok") {
    return "✅ Full offline support enabled";
  } else if (status.overall === "warning") {
    const warnings = [];
    if (status.serviceWorker.status === "warning")
      warnings.push("Service Worker not yet active");
    if (status.backgroundSync.status === "warning")
      warnings.push("Manual sync only");
    if (status.cacheAPI.status === "warning") warnings.push("No asset caching");

    return `⚠️ Offline support limited: ${warnings.join(", ")}`;
  } else {
    return "❌ Offline support unavailable in this browser";
  }
}
