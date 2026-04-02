import { useState, useEffect } from "react";
import { syncManager } from "../utils/syncManager";

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      console.log("🌐 Connection restored - Back online");
      setIsOnline(true);
      setWasOffline(true);

      // Reset wasOffline flag after 5 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 5000);

      // Trigger background sync if service worker is available
      if (
        "serviceWorker" in navigator &&
        "sync" in ServiceWorkerRegistration.prototype
      ) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register("sync-pending-actions");
          console.log("🔄 Background sync registered");
        } catch (err) {
          console.warn("⚠️ Background sync not available, using manual sync");
          // Fallback to manual sync
          triggerManualSync();
        }
      } else {
        console.log("ℹ️ Background sync not supported, using manual sync");
        // Fallback to manual sync
        triggerManualSync();
      }
    };

    const handleOffline = () => {
      console.log("📴 Connection lost - Working offline");
      setIsOnline(false);
      setWasOffline(false);
    };

    const triggerManualSync = async () => {
      // Manual sync as fallback when Background Sync API is not available
      console.log("🔄 Triggering manual sync...");
      try {
        await syncManager.syncPendingActions();
        console.log("✅ Manual sync complete");
      } catch (error) {
        console.error("❌ Manual sync failed:", error);
      }
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic connectivity check (every 30 seconds)
    const intervalId = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        if (currentStatus) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  };
}
