/**
 * Backend-driven cache invalidation (in-memory only; no browser storage).
 */

import { checkBackendHealth } from "./backendHealthCheck";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

let loadedVersion = null;
let lastVersionCheckAt = 0;

export async function checkBackendVersionAndInvalidate() {
  try {
    const now = Date.now();
    if (
      lastVersionCheckAt &&
      now - lastVersionCheckAt < CHECK_INTERVAL_MS
    ) {
      console.log("⏭️ Skipping version check (checked recently)");
      return false;
    }

    const health = await checkBackendHealth();
    if (!health.online) {
      console.log("⚠️ Backend offline - skipping version check");
      return false;
    }

    const backendVersion = health.version || "1.0.0";
    console.log("🔍 Version check:", {
      backend: backendVersion,
      local: loadedVersion || "none",
    });

    lastVersionCheckAt = now;

    if (loadedVersion !== backendVersion) {
      console.log("🔄 Backend version changed - invalidating in-memory markers");
      loadedVersion = backendVersion;
      notifyUserOfUpdate(backendVersion);
      return true;
    }

    if (!loadedVersion) {
      loadedVersion = backendVersion;
    }

    return false;
  } catch (error) {
    console.error("❌ Failed to check backend version:", error);
    return false;
  }
}

async function invalidateCache() {
  console.log("🧹 Cache invalidation (no browser storage).");
}

function notifyUserOfUpdate(version) {
  console.log(`📢 App updated to version ${version}`);
  if (typeof window !== "undefined") {
    const toast = window.toast;
    if (toast) {
      toast.success(`App refreshed for update ${version}`, { duration: 4000 });
    }
  }
}

export async function forceInvalidateCache() {
  console.log("🚨 FORCE cache invalidation triggered");
  await invalidateCache();
  loadedVersion = null;
  lastVersionCheckAt = 0;
}

export async function handleBackendVersionCheck() {
  console.log("🔍 Checking backend version...");
  try {
    await checkBackendVersionAndInvalidate();
  } catch (error) {
    console.error("❌ Backend version check failed:", error);
  }
}

export function startBackgroundVersionCheck() {
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
