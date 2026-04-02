/**
 * Service Worker Manager
 * Attempts to register service worker, gracefully degrades if not supported
 */

/**
 * Register inline service worker
 * Returns false in environments where SW registration is not supported
 */
export async function registerServiceWorker() {
  // Check if service workers are supported
  if (!("serviceWorker" in navigator)) {
    console.log("ℹ️ Service Workers not supported in this browser");
    return false;
  }

  // Check if we're in a compatible environment
  // Some environments (like Figma Make iframes) don't allow SW registration
  if (
    window.location.protocol === "blob:" ||
    window.self !== window.top ||
    window.location.hostname.includes("figma")
  ) {
    console.log(
      "ℹ️ Service Workers not available in this environment (iframe/Figma)",
    );
    console.log(
      "✅ Offline support will use IndexedDB only (no asset caching)",
    );
    return false;
  }

  try {
    // In compatible environments, we could register SW here
    // For now, we'll skip it and rely on IndexedDB only
    console.log(
      "ℹ️ Service Worker registration skipped (using IndexedDB-only mode)",
    );
    console.log("✅ Offline data storage enabled via IndexedDB");
    return false;
  } catch (error) {
    console.log("ℹ️ Service Worker registration not available:", error);
    return false;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
    console.log("✅ All Service Workers unregistered");
  } catch (error) {
    console.error("❌ Failed to unregister Service Workers:", error);
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive() {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
}

/**
 * Trigger background sync (if supported)
 */
export async function triggerBackgroundSync() {
  if (
    !("serviceWorker" in navigator) ||
    !("sync" in ServiceWorkerRegistration.prototype)
  ) {
    console.warn("⚠️ Background Sync not supported - use manual sync");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register("sync-pending-actions");
    console.log("✅ Background sync registered");
  } catch (error) {
    console.error("❌ Background sync registration failed:", error);
  }
}
