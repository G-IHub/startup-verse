/**
 * Offline Banner Component
 * Shows connection status and sync information
 */

import React, { useEffect, useState } from "react";
import { useOfflineDetection } from "../../hooks/useOfflineDetection";
import { syncManager } from "../../utils/syncManager";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
export default function OfflineBanner() {
  const { isOnline, isOffline, wasOffline } = useOfflineDetection();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState(null);

  // Update pending count
  useEffect(() => {
    updatePendingCount();
  }, [isOffline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      handleSync();
    }
  }, [wasOffline, isOnline]);
  const updatePendingCount = async () => {
    const count = await syncManager.getPendingCount();
    setPendingCount(count);
  };
  const handleSync = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);
    try {
      const result = await syncManager.syncPendingActions();
      if (result.failed === 0) {
        setLastSyncStatus("success");
      } else {
        setLastSyncStatus("failed");
      }
      await updatePendingCount();
    } catch (error) {
      console.error("❌ Sync failed:", error);
      setLastSyncStatus("failed");
    } finally {
      setIsSyncing(false);

      // Clear status after 3 seconds
      setTimeout(() => {
        setLastSyncStatus(null);
      }, 3000);
    }
  };

  // Don't show banner if online and no pending actions
  if (isOnline && pendingCount === 0 && !wasOffline) {
    return null;
  }
  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      {isOffline && (
        <div className="bg-orange-600 dark:bg-orange-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">You're offline</p>
                  <p className="text-xs opacity-90">
                    Changes will be saved locally and synced when you're back
                    online
                    {pendingCount > 0 &&
                      ` • ${pendingCount} pending action${pendingCount !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  {pendingCount}
                  {" pending"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
      {isOnline && wasOffline && (
        <div className="bg-green-600 dark:bg-green-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">You're back online</p>
                  <p className="text-xs opacity-90">
                    {isSyncing && "Syncing your changes..."}
                    {!isSyncing &&
                      lastSyncStatus === "success" &&
                      "All changes synced successfully"}
                    {!isSyncing &&
                      lastSyncStatus === "failed" &&
                      "Some changes failed to sync"}
                    {!isSyncing &&
                      !lastSyncStatus &&
                      pendingCount > 0 &&
                      `${pendingCount} change${pendingCount !== 1 ? "s" : ""} ready to sync`}
                    {!isSyncing &&
                      !lastSyncStatus &&
                      pendingCount === 0 &&
                      "Connection restored"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lastSyncStatus === "success" && (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {lastSyncStatus === "failed" && (
                  <AlertCircle className="w-5 h-5" />
                )}
                {pendingCount > 0 && !isSyncing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSync}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </Button>
                )}
                {isSyncing && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Syncing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {isOnline && !wasOffline && pendingCount > 0 && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Pending changes</p>
                  <p className="text-xs opacity-90">
                    {"You have "}
                    {pendingCount}
                    {" unsynchronized change"}
                    {pendingCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
