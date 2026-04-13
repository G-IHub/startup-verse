/**
 * Socket.IO client aligned with server/src/realtime (rooms + SOCKET_EVENTS).
 */

import { io } from "socket.io-client";
import { getSocketBaseUrl } from "./socketBaseUrl.js";
import { getConversation } from "./messaging.js";

/** Mirrors server/src/realtime/rooms.js */
export function startupSocketRoom(startupId) {
  return `startup:${String(startupId)}`;
}

export function userSocketRoom(userId) {
  return `user:${String(userId)}`;
}

class SocketEngine {
  static instance = null;

  static getSocket() {
    if (!SocketEngine.instance) {
      SocketEngine.instance = io(getSocketBaseUrl(), {
        reconnectionAttempts: 8,
        reconnectionDelay: 2000,
      });

      SocketEngine.instance.on("connect", () => {
        console.log(
          "✅ [Realtime] Socket connected",
          SocketEngine.instance?.id,
        );
      });

      SocketEngine.instance.on("connect_error", (err) => {
        console.error("❌ [Realtime] Socket error:", err.message);
      });
    }
    return SocketEngine.instance;
  }
}

export function isRealtimeConnected() {
  return Boolean(SocketEngine.instance?.connected);
}

function joinRoom(roomId) {
  const socket = SocketEngine.getSocket();
  socket.emit("room:join", roomId);
}

function leaveRoom(roomId) {
  const socket = SocketEngine.getSocket();
  socket.emit("room:leave", roomId);
}

/**
 * Subscribe to a server-emitted event after joining a room.
 */
function createSubscription(roomId, eventName, onPayload) {
  const socket = SocketEngine.getSocket();
  joinRoom(roomId);

  const listener = (payload) => {
    console.log(`📥 [Realtime] ${eventName} @ ${roomId}`);
    onPayload(payload);
  };

  socket.on(eventName, listener);

  return () => {
    socket.off(eventName, listener);
    leaveRoom(roomId);
  };
}

function mapTaskDoc(task) {
  if (!task || typeof task !== "object") return task;
  const id = task._id != null ? String(task._id) : task.id;
  return { ...task, id };
}

function mapServerMessageToClient(m) {
  if (!m || typeof m !== "object") return m;
  const id = m._id != null ? String(m._id) : m.id;
  return {
    id,
    senderId: String(m.fromUserId),
    recipientId: String(m.toUserId),
    content: m.body || "",
    timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
    startupId: m.startupId != null ? String(m.startupId) : m.startupId,
    read: Boolean(m.readAt),
  };
}

// ========================================
// TEAM MEMBERS — no server broadcast yet
// ========================================

export function subscribeToTeamMembers(_startupId, _onUpdate) {
  return () => {};
}

export async function broadcastTeamMemberUpdate() {
  return false;
}

// ========================================
// TASKS — server emits task:updated
// ========================================

export function subscribeToTasks(startupId, onUpdate) {
  return createSubscription(
    startupSocketRoom(startupId),
    "task:updated",
    (task) => {
      onUpdate({
        action: "updated",
        task: mapTaskDoc(task),
      });
    },
  );
}

export async function broadcastTaskUpdate() {
  return false;
}

// ========================================
// MESSAGES — server emits message:created
// ========================================

const MESSAGE_POLL_MS = 50_000;
const MESSAGE_POLL_GRACE_MS = 4_000;

/**
 * @param {string} startupId
 * @param {(update: object) => void} onUpdate
 * @param {{ userId?: string, peerUserId?: string } | null} [pollContext] Optional REST fallback while the socket is offline (bounded interval).
 */
export function subscribeToMessages(startupId, onUpdate, pollContext = null) {
  let pollTimer = null;
  let graceTimer = null;
  let stopped = false;
  const seenIds = new Set();

  const clearTimers = () => {
    if (pollTimer != null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (graceTimer != null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
  };

  const armPollingIfNeeded = () => {
    if (
      stopped ||
      !pollContext?.userId ||
      !pollContext?.peerUserId ||
      isRealtimeConnected()
    ) {
      return;
    }
    if (pollTimer != null || graceTimer != null) return;

    graceTimer = setTimeout(() => {
      graceTimer = null;
      if (stopped || isRealtimeConnected()) return;

      const tick = async () => {
        if (stopped || isRealtimeConnected()) {
          clearTimers();
          return;
        }
        try {
          const rows = await getConversation(
            pollContext.userId,
            pollContext.peerUserId,
            startupId,
          );
          if (!Array.isArray(rows)) return;
          for (const row of rows) {
            const mapped = mapServerMessageToClient(row);
            if (!mapped?.id || seenIds.has(mapped.id)) continue;
            seenIds.add(mapped.id);
            onUpdate({
              action: "new_message",
              message: mapped,
              fromUserId: mapped.senderId,
              toUserId: mapped.recipientId,
            });
          }
        } catch {
          /* transient fetch errors */
        }
      };

      void tick();
      pollTimer = setInterval(() => void tick(), MESSAGE_POLL_MS);
    }, MESSAGE_POLL_GRACE_MS);
  };

  const socket = SocketEngine.getSocket();
  const onConnect = () => {
    clearTimers();
  };
  const onDisconnect = () => {
    armPollingIfNeeded();
  };
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);

  const coreUnsub = createSubscription(
    startupSocketRoom(startupId),
    "message:created",
    (message) => {
      const mapped = mapServerMessageToClient(message);
      if (mapped?.id) seenIds.add(mapped.id);
      onUpdate({
        action: "new_message",
        message: mapped,
        fromUserId: mapped.senderId,
        toUserId: mapped.recipientId,
      });
    },
  );

  armPollingIfNeeded();

  return () => {
    stopped = true;
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    clearTimers();
    coreUnsub();
  };
}

export async function broadcastMessageUpdate() {
  return false;
}

// ========================================
// ACTIVITIES — server emits activity:created
// ========================================

export function subscribeToActivities(startupId, onNewActivity) {
  return createSubscription(
    startupSocketRoom(startupId),
    "activity:created",
    (payload) => onNewActivity(payload),
  );
}

export async function broadcastActivity() {
  return false;
}

// ========================================
// ANNOUNCEMENTS / WINS — not emitted server-side yet
// ========================================

export function subscribeToAnnouncements() {
  return () => {};
}

export async function broadcastAnnouncementUpdate() {
  return false;
}

export function subscribeToWins() {
  return () => {};
}

export async function broadcastWinUpdate() {
  return false;
}

// ========================================
// PRESENCE — presence:updated / presence:removed
// ========================================

export function subscribeToPresence(startupId, _userId, _userName, onPresenceChange) {
  const socket = SocketEngine.getSocket();
  const roomId = startupSocketRoom(startupId);
  joinRoom(roomId);

  const byUser = new Map();

  const pushList = () => {
    onPresenceChange(Array.from(byUser.values()));
  };

  const onUpdated = (p) => {
    if (!p || String(p.startupId) !== String(startupId)) return;
    const uid = String(p.userId);
    if (p.isOnline) {
      byUser.set(uid, p);
    } else {
      byUser.delete(uid);
    }
    pushList();
  };

  const onRemoved = (payload) => {
    if (!payload || String(payload.startupId) !== String(startupId)) return;
    byUser.delete(String(payload.userId));
    pushList();
  };

  socket.on("presence:updated", onUpdated);
  socket.on("presence:removed", onRemoved);

  return () => {
    socket.off("presence:updated", onUpdated);
    socket.off("presence:removed", onRemoved);
    leaveRoom(roomId);
  };
}

// ========================================
// UNREAD — notification:created (bump only)
// ========================================

export function subscribeToUnreadCount(_startupId, userId, onUpdate) {
  const roomId = userSocketRoom(userId);
  return createSubscription(roomId, "notification:created", () => {
    onUpdate({ countDelta: 1 });
  });
}

export async function broadcastUnreadCountUpdate() {
  return false;
}

// ========================================
// CLEANUP
// ========================================

export function cleanupAllSubscriptions() {
  if (SocketEngine.instance) {
    SocketEngine.instance.disconnect();
    SocketEngine.instance = null;
  }
}
