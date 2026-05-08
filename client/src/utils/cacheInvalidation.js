/**
 * Client-side version marker (in-memory only).
 */

const CURRENT_APP_VERSION = "1.0.2";

let storedMarker = null;

export function checkAndInvalidateCache() {
  if (storedMarker !== CURRENT_APP_VERSION) {
    console.log("🔄 Cache invalidation triggered (memory marker)");
    invalidateCache();
    storedMarker = CURRENT_APP_VERSION;
    return true;
  }
  return false;
}

export function invalidateCache() {
  console.log("🧹 invalidateCache (no browser storage)");
}

export function forceHardRefresh() {
  window.location.reload();
}

export function notifyUserOfCacheClear() {
  console.log("📢 Cache marker reset");
  if (typeof window !== "undefined" && window.toast) {
    window.toast.info("App updated — refresh if something looks stale");
  }
}

export function handleAppVersionCheck() {
  const wasInvalidated = checkAndInvalidateCache();
  if (wasInvalidated) {
    notifyUserOfCacheClear();
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
