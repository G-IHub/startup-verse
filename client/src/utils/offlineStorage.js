/**
 * IndexedDB wrapper for offline data storage
 * Stores tasks, performance metrics, and pending actions
 */

const DB_NAME = "StartupVerseDB";
const DB_VERSION = 1;

// Object store names
const STORES = {
  TASKS: "tasks",
  PERFORMANCE: "performance",
  PENDING_ACTIONS: "pendingActions",
  TEAM_MEMBERS: "teamMembers",
  MESSAGES: "messages",
};

class OfflineStorage {
  db = null;

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("❌ IndexedDB: Failed to open database", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB: Database opened successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log("🔧 IndexedDB: Upgrading database schema...");

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, {
            keyPath: "id",
          });
          taskStore.createIndex("userId", "assignedTo", { unique: false });
          taskStore.createIndex("status", "status", { unique: false });
          console.log("✅ Created tasks store");
        }

        if (!db.objectStoreNames.contains(STORES.PERFORMANCE)) {
          db.createObjectStore(STORES.PERFORMANCE, { keyPath: "userId" });
          console.log("✅ Created performance store");
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
          const actionStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
            keyPath: "id",
            autoIncrement: true,
          });
          actionStore.createIndex("timestamp", "timestamp", { unique: false });
          console.log("✅ Created pending actions store");
        }

        if (!db.objectStoreNames.contains(STORES.TEAM_MEMBERS)) {
          db.createObjectStore(STORES.TEAM_MEMBERS, { keyPath: "id" });
          console.log("✅ Created team members store");
        }

        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORES.MESSAGES, {
            keyPath: "id",
          });
          messageStore.createIndex("conversationId", "conversationId", {
            unique: false,
          });
          console.log("✅ Created messages store");
        }

        console.log("✅ IndexedDB: Schema upgrade complete");
      };
    });
  }

  /**
   * Save tasks to IndexedDB
   */
  async saveTasks(tasks) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.TASKS, "readwrite");
      const store = tx.objectStore(STORES.TASKS);

      // Clear existing tasks first
      store.clear();

      // Add all tasks
      tasks.forEach((task) => {
        store.put(task);
      });

      tx.oncomplete = () => {
        console.log(`✅ IndexedDB: Saved ${tasks.length} tasks`);
        resolve();
      };

      tx.onerror = () => {
        console.error("❌ IndexedDB: Failed to save tasks", tx.error);
        reject(tx.error);
      };
    });
  }

  /**
   * Get all tasks from IndexedDB
   */
  async getTasks(userId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.TASKS, "readonly");
      const store = tx.objectStore(STORES.TASKS);

      let request;

      if (userId) {
        // Get tasks for specific user
        const index = store.index("userId");
        request = index.getAll(userId);
      } else {
        // Get all tasks
        request = store.getAll();
      }

      request.onsuccess = () => {
        console.log(`✅ IndexedDB: Retrieved ${request.result.length} tasks`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("❌ IndexedDB: Failed to get tasks", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save performance metrics
   */
  async savePerformance(userId, metrics) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.PERFORMANCE, "readwrite");
      const store = tx.objectStore(STORES.PERFORMANCE);

      const data = {
        userId,
        ...metrics,
        cachedAt: new Date().toISOString(),
      };

      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`✅ IndexedDB: Saved performance for user ${userId}`);
        resolve();
      };

      request.onerror = () => {
        console.error(
          "❌ IndexedDB: Failed to save performance",
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformance(userId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.PERFORMANCE, "readonly");
      const store = tx.objectStore(STORES.PERFORMANCE);
      const request = store.get(userId);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`✅ IndexedDB: Retrieved performance for user ${userId}`);
          resolve(request.result);
        } else {
          console.log(`ℹ️ IndexedDB: No performance data for user ${userId}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("❌ IndexedDB: Failed to get performance", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add pending action to sync queue
   */
  async addPendingAction(action) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.PENDING_ACTIONS, "readwrite");
      const store = tx.objectStore(STORES.PENDING_ACTIONS);

      const pendingAction = {
        ...action,
        timestamp: new Date().toISOString(),
        status: "pending",
      };

      const request = store.add(pendingAction);

      request.onsuccess = () => {
        console.log(`✅ IndexedDB: Added pending action (${action.type})`);
        resolve();
      };

      request.onerror = () => {
        console.error(
          "❌ IndexedDB: Failed to add pending action",
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending actions
   */
  async getPendingActions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.PENDING_ACTIONS, "readonly");
      const store = tx.objectStore(STORES.PENDING_ACTIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(
          `✅ IndexedDB: Retrieved ${request.result.length} pending actions`,
        );
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(
          "❌ IndexedDB: Failed to get pending actions",
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Remove pending action after successful sync
   */
  async removePendingAction(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.PENDING_ACTIONS, "readwrite");
      const store = tx.objectStore(STORES.PENDING_ACTIONS);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`✅ IndexedDB: Removed pending action ${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error(
          "❌ IndexedDB: Failed to remove pending action",
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Clear all pending actions
   */
  async clearPendingActions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.PENDING_ACTIONS, "readwrite");
      const store = tx.objectStore(STORES.PENDING_ACTIONS);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("✅ IndexedDB: Cleared all pending actions");
        resolve();
      };

      request.onerror = () => {
        console.error(
          "❌ IndexedDB: Failed to clear pending actions",
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Save team members
   */
  async saveTeamMembers(members) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.TEAM_MEMBERS, "readwrite");
      const store = tx.objectStore(STORES.TEAM_MEMBERS);

      store.clear();

      members.forEach((member) => {
        store.put(member);
      });

      tx.oncomplete = () => {
        console.log(`✅ IndexedDB: Saved ${members.length} team members`);
        resolve();
      };

      tx.onerror = () => {
        console.error("❌ IndexedDB: Failed to save team members", tx.error);
        reject(tx.error);
      };
    });
  }

  /**
   * Get team members
   */
  async getTeamMembers() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORES.TEAM_MEMBERS, "readonly");
      const store = tx.objectStore(STORES.TEAM_MEMBERS);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(
          `✅ IndexedDB: Retrieved ${request.result.length} team members`,
        );
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(
          "❌ IndexedDB: Failed to get team members",
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    if (!this.db) await this.init();

    const storeNames = [
      STORES.TASKS,
      STORES.PERFORMANCE,
      STORES.PENDING_ACTIONS,
      STORES.TEAM_MEMBERS,
      STORES.MESSAGES,
    ];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeNames, "readwrite");

      storeNames.forEach((storeName) => {
        tx.objectStore(storeName).clear();
      });

      tx.oncomplete = () => {
        console.log("✅ IndexedDB: Cleared all data");
        resolve();
      };

      tx.onerror = () => {
        console.error("❌ IndexedDB: Failed to clear data", tx.error);
        reject(tx.error);
      };
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on import
offlineStorage.init().catch((err) => {
  console.error("❌ Failed to initialize IndexedDB:", err);
});
