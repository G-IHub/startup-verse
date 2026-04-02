/**
 * Comprehensive Real-time Subscriptions (Socket.IO version replacing Supabase)
 * Replaces all polling with real-time event-driven updates
 *
 * Architecture:
 * - Uses Socket.IO for client-to-server and client-to-client sync
 * - Each user joins rooms per startup (e.g. `startup_${startupId}`)
 * - Components subscribe once and receive incremental updates
 * - No visible refreshing or flicker
 */

import { io } from "socket.io-client";

// Initialize single connection to the Express server
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class SocketEngine {
  static instance = null;

  static getSocket() {
    if (!SocketEngine.instance) {
      SocketEngine.instance = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      SocketEngine.instance.on("connect", () => {
        console.log(
          "✅ [Realtime] Connected to standalone Socket.IO Engine",
          SocketEngine.instance?.id,
        );
      });

      SocketEngine.instance.on("connect_error", (err) => {
        console.error("❌ [Realtime] Socket connection error:", err.message);
      });
    }
    return SocketEngine.instance;
  }

  static joinRoom(roomId) {
    const socket = SocketEngine.getSocket();
    socket.emit("join_room", roomId);
    console.log(`📡 [Realtime] Requested to join room: ${roomId}`);
  }

  static leaveRoom(roomId) {
    const socket = SocketEngine.getSocket();
    socket.emit("leave_room", roomId);
    console.log(`🔌 [Realtime] Requested to leave room: ${roomId}`);
  }
}

/**
 * Generic subscription function
 */
function createSubscription(roomId, eventName, onUpdate, onSync) {
  const socket = SocketEngine.getSocket();

  // Join the correct room first
  SocketEngine.joinRoom(roomId);

  const listener = (payload) => {
    console.log(`📥 [Realtime] Received ${eventName} in ${roomId}:`, payload);
    onUpdate(payload);
  };

  socket.on(eventName, listener);

  if (onSync) onSync();

  // Return cleanup function
  return () => {
    console.log(`🔌 [Realtime] Unsubscribing from ${eventName}`);
    socket.off(eventName, listener);
    // Optionally leave room if strictly needed, but rooms might be shared across events.
    // SocketEngine.leaveRoom(roomId);
  };
}

/**
 * Generic broadcast function
 */
async function broadcast(roomId, eventName, data) {
  try {
    const socket = SocketEngine.getSocket();
    console.log(`📡 [Realtime] Broadcasting ${eventName} to ${roomId}`);

    // In Socket.IO, we emit to the server, and the server broadcasts to the room
    socket.emit(eventName, { roomId, payload: data });

    return true;
  } catch (error) {
    console.error(`⚠️ [Realtime] Broadcast failed (non-critical):`, error);
    return false;
  }
}

// ========================================
// TEAM MEMBERS REALTIME
// ========================================

export function subscribeToTeamMembers(startupId, onUpdate) {
  return createSubscription(`startup_${startupId}`, "team_update", onUpdate);
}

export async function broadcastTeamMemberUpdate(startupId, action, member) {
  return broadcast(`startup_${startupId}`, "team_update", {
    action,
    member,
    startupId,
    timestamp: new Date().toISOString(),
  });
}

// ========================================
// TASKS REALTIME
// ========================================

export function subscribeToTasks(startupId, onUpdate) {
  return createSubscription(`startup_${startupId}`, "task_update", onUpdate);
}

export async function broadcastTaskUpdate(startupId, action, task) {
  return broadcast(`startup_${startupId}`, "task_update", {
    action,
    task,
    startupId,
    timestamp: new Date().toISOString(),
  });
}

// ========================================
// MESSAGES REALTIME
// ========================================

export function subscribeToMessages(startupId, onUpdate) {
  return createSubscription(`startup_${startupId}`, "message_update", onUpdate);
}

export async function broadcastMessageUpdate(startupId, action, data) {
  return broadcast(`startup_${startupId}`, "message_update", {
    action,
    startupId,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

// ========================================
// ACTIVITIES REALTIME
// ========================================

export function subscribeToActivities(startupId, onNewActivity) {
  return createSubscription(
    `startup_${startupId}`,
    "new_activity",
    onNewActivity,
  );
}

export async function broadcastActivity(startupId, activity) {
  return broadcast(`startup_${startupId}`, "new_activity", activity);
}

// ========================================
// ANNOUNCEMENTS REALTIME
// ========================================

export function subscribeToAnnouncements(startupId, onUpdate) {
  return createSubscription(
    `startup_${startupId}`,
    "announcement_update",
    onUpdate,
  );
}

export async function broadcastAnnouncementUpdate(
  startupId,
  action,
  announcement,
) {
  return broadcast(`startup_${startupId}`, "announcement_update", {
    action,
    announcement,
    startupId,
    timestamp: new Date().toISOString(),
  });
}

// ========================================
// WALL OF WINS REALTIME
// ========================================

export function subscribeToWins(startupId, onUpdate) {
  return createSubscription(`startup_${startupId}`, "win_update", onUpdate);
}

export async function broadcastWinUpdate(startupId, action, win) {
  return broadcast(`startup_${startupId}`, "win_update", {
    action,
    win,
    startupId,
    timestamp: new Date().toISOString(),
  });
}

// ========================================
// PRESENCE REALTIME (Online/Offline status)
// ========================================

export function subscribeToPresence(
  startupId,
  userId,
  userName,
  onPresenceChange,
) {
  const socket = SocketEngine.getSocket();
  const roomId = `startup_${startupId}`;

  SocketEngine.joinRoom(roomId);

  socket.emit("presence_join", { roomId, userId, userName });

  const listener = (users) => {
    onPresenceChange(users);
  };

  socket.on("presence_sync", listener);

  return () => {
    socket.emit("presence_leave", { roomId, userId });
    socket.off("presence_sync", listener);
  };
}

// ========================================
// UNREAD COUNT REALTIME
// ========================================

export function subscribeToUnreadCount(startupId, userId, onUpdate) {
  return createSubscription(
    `user_${userId}`, // Note: this maps to a user-specific room
    "unread_update",
    onUpdate,
  );
}

export async function broadcastUnreadCountUpdate(startupId, userId, count) {
  return broadcast(`user_${userId}`, "unread_update", {
    userId,
    count,
    startupId,
    timestamp: new Date().toISOString(),
  });
}

// ========================================
// CLEANUP ALL SUBSCRIPTIONS
// ========================================

export function cleanupAllSubscriptions() {
  console.log(`🧹 [Realtime] Cleaning up all socket connections`);
  if (SocketEngine.instance) {
    SocketEngine.instance.disconnect();
    SocketEngine.instance = null;
  }
}
