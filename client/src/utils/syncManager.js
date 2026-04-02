/**
 * Sync Manager for offline actions
 * Queues actions when offline and syncs when back online
 */

import { offlineStorage } from "./offlineStorage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaderValue() {
  const token = localStorage.getItem("startupverse_token") || "";
  return `Bearer ${token}`;
}

class SyncManager {
  isSyncing = false;
  syncCallbacks = [];

  /**
   * Queue an action for later sync (when offline)
   */
  async queueAction(action) {
    console.log(`📥 Queueing offline action: ${action.type}`);

    await offlineStorage.addPendingAction({
      type: action.type,
      endpoint: action.endpoint,
      method: action.method,
      data: {
        ...action.data,
        authorization: getAuthHeaderValue(),
      },
    });

    console.log(`✅ Action queued: ${action.type}`);
  }

  /**
   * Execute action immediately (when online)
   */
  async executeAction(action) {
    console.log(`🚀 Executing action: ${action.type}`);

    const response = await fetch(action.endpoint, {
      method: action.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: action.method !== "GET" ? JSON.stringify(action.data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP ${response.status}: ${errorData.error || response.statusText}`,
      );
    }

    const result = await response.json();
    console.log(`✅ Action executed: ${action.type}`);
    return result;
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions() {
    if (this.isSyncing) {
      console.log("⏳ Sync already in progress...");
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    console.log("🔄 Starting sync of pending actions...");

    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      console.log(`📋 Found ${pendingActions.length} pending actions to sync`);

      if (pendingActions.length === 0) {
        console.log("✅ No pending actions to sync");
        this.isSyncing = false;
        return { success: 0, failed: 0 };
      }

      // Process actions sequentially to maintain order
      for (const action of pendingActions) {
        try {
          console.log(`🔄 Syncing action ${action.id}: ${action.type}`);

          const response = await fetch(action.endpoint, {
            method: action.method,
            headers: {
              "Content-Type": "application/json",
              Authorization: action.data.authorization || getAuthHeaderValue(),
            },
            body: JSON.stringify(action.data),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Remove from pending queue after successful sync
          await offlineStorage.removePendingAction(action.id);
          successCount++;
          console.log(`✅ Synced action ${action.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync action ${action.id}:`, error);
          failedCount++;
          // Keep in queue for retry later
        }
      }

      console.log(
        `✅ Sync complete: ${successCount} success, ${failedCount} failed`,
      );

      // Notify callbacks
      this.notifyCallbacks(failedCount === 0);

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error("❌ Sync failed:", error);
      this.notifyCallbacks(false);
      return { success: successCount, failed: failedCount };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Register callback for sync completion
   */
  onSyncComplete(callback) {
    this.syncCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  notifyCallbacks(success) {
    this.syncCallbacks.forEach((callback) => {
      try {
        callback(success);
      } catch (error) {
        console.error("❌ Sync callback error:", error);
      }
    });
  }

  /**
   * Get pending action count
   */
  async getPendingCount() {
    const actions = await offlineStorage.getPendingActions();
    return actions.length;
  }

  /**
   * Clear all pending actions (use with caution)
   */
  async clearAllPending() {
    console.log("🗑️ Clearing all pending actions...");
    await offlineStorage.clearPendingActions();
    console.log("✅ All pending actions cleared");
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

/**
 * Helper function to execute action with offline support
 */
export async function executeWithOfflineSupport(action, isOnline) {
  if (isOnline) {
    // Execute immediately
    return await syncManager.executeAction(action);
  } else {
    // Queue for later
    await syncManager.queueAction(action);
    return {
      success: true,
      offline: true,
      message: "Action queued for sync when back online",
    };
  }
}
