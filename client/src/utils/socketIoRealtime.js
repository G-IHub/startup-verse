/**
 * Socket.IO client aligned with server/src/realtime (rooms + SOCKET_EVENTS).
 */

import { io } from "socket.io-client";
import { getSocketBaseUrl } from "./socketBaseUrl.js";
import { getConversation, mapMessageDto } from "./messaging.js";
import { getStartupActivities, getStartupWins } from "./activityApi.js";
import { getFounderTasks, getTeamMemberTasks } from "./api/taskApi.js";
import { getStartupAnnouncements } from "./announcementApi.js";
import { getActiveUsers } from "./presenceApi.js";
import { normalizePresenceRow } from "../domains/presence/presenceModel.js";

/** Mirrors server/src/realtime/rooms.js */
export function startupSocketRoom(startupId) {
  return `startup:${String(startupId)}`;
}

export function userSocketRoom(userId) {
  return `user:${String(userId)}`;
}

/** Matches server/src/realtime/rooms.js announcementRoom */
export function announcementSocketRoom(startupId) {
  return `announcements:${String(startupId)}`;
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

/** Subscribe to server presence broadcasts (payloads are hints; prefer GET refresh). */
export function listenForPresenceChanges(handler) {
  const socket = SocketEngine.getSocket();
  socket.on("presence:updated", handler);
  socket.on("presence:removed", handler);
  socket.on("connect", handler);
  return () => {
    socket.off("presence:updated", handler);
    socket.off("presence:removed", handler);
    socket.off("connect", handler);
  };
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
  const mapped = mapMessageDto({
    ...m,
    id: m._id != null ? String(m._id) : m.id,
    fromUserId: m.fromUserId || m.senderId,
    toUserId: m.toUserId || m.recipientId,
    body: m.body || m.content,
  });
  return mapped || m;
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

const TASK_POLL_MS = 20_000;
const TASK_POLL_GRACE_MS = 4_000;

export function subscribeToTasks(startupId, onUpdate, pollContext = null) {
  let pollTimer = null;
  let graceTimer = null;
  let stopped = false;

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

  const emitRows = (rows = []) => {
    const seenIds = new Set();
    rows.forEach((row) => {
      const mapped = mapTaskDoc(row);
      const id = String(mapped.id || mapped._id || "");
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      onUpdate({ action: "updated", task: mapped });
    });
  };

  const pollTasks = async () => {
    if (stopped || isRealtimeConnected()) {
      clearTimers();
      return;
    }
    const isFounder = pollContext?.role === "founder";
    const canPoll =
      Boolean(pollContext) &&
      (isFounder ? Boolean(pollContext?.founderId) : Boolean(pollContext?.userId));
    if (!canPoll) {
      clearTimers();
      return;
    }
    try {
      const rows =
        isFounder
          ? await getFounderTasks(pollContext.founderId)
          : await getTeamMemberTasks(pollContext.userId);
      emitRows(rows || []);
    } catch {
      // Keep silent; realtime path remains primary.
    }
  };

  const armPollingIfNeeded = () => {
    if (stopped || isRealtimeConnected()) return;
    if (pollTimer != null || graceTimer != null) return;
    graceTimer = setTimeout(() => {
      graceTimer = null;
      if (stopped || isRealtimeConnected()) return;
      pollTasks();
      pollTimer = setInterval(pollTasks, TASK_POLL_MS);
    }, TASK_POLL_GRACE_MS);
  };

  const offTask = createSubscription(
    startupSocketRoom(startupId),
    "task:updated",
    (task) => {
      const mapped = mapTaskDoc(task);
      onUpdate({ action: "updated", task: mapped });
    },
  );

  const offTaskDeleted = createSubscription(
    startupSocketRoom(startupId),
    "task:deleted",
    (payload) => {
      const taskId = payload?.taskId != null ? String(payload.taskId) : "";
      if (!taskId) return;
      onUpdate({ action: "deleted", task: { id: taskId, _id: taskId } });
    },
  );

  const socket = SocketEngine.getSocket();
  const manager = socket.io;
  const onDisconnect = () => armPollingIfNeeded();
  const onReconnect = () => clearTimers();
  socket.on("disconnect", onDisconnect);
  manager.on("reconnect", onReconnect);
  armPollingIfNeeded();

  return () => {
    stopped = true;
    clearTimers();
    socket.off("disconnect", onDisconnect);
    manager.off("reconnect", onReconnect);
    offTask?.();
    offTaskDeleted?.();
  };
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

  const messageRoomId = pollContext?.userId
    ? userSocketRoom(pollContext.userId)
    : startupSocketRoom(startupId);
  const onCreated = (message) => {
    const mapped = mapServerMessageToClient(message);
    if (mapped?.id) seenIds.add(mapped.id);
    onUpdate({
      action: "new_message",
      message: mapped,
      fromUserId: mapped.senderId,
      toUserId: mapped.recipientId,
    });
  };

  const onUpdated = (payload) => {
    const mapped = mapServerMessageToClient(payload);
    onUpdate({
      action: "message_updated",
      message: mapped,
      fromUserId: mapped?.senderId,
      toUserId: mapped?.recipientId,
    });
  };

  const coreUnsub = createSubscription(
    messageRoomId,
    "message:created",
    onCreated,
  );

  joinRoom(messageRoomId);
  socket.on("message:updated", onUpdated);

  armPollingIfNeeded();

  return () => {
    stopped = true;
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("message:updated", onUpdated);
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

const ACTIVITY_POLL_MS = 35_000;
const ACTIVITY_POLL_GRACE_MS = 3_000;

export function subscribeToActivities(startupId, onNewActivity) {
  let pollTimer = null;
  let graceTimer = null;
  let stopped = false;
  const seenIds = new Set();
  const socket = SocketEngine.getSocket();

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

  const emitRows = (rows) => {
    for (const row of rows) {
      if (!row?.id) continue;
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      onNewActivity(row);
    }
  };

  const armPollingIfNeeded = () => {
    if (stopped || isRealtimeConnected()) return;
    if (pollTimer != null || graceTimer != null) return;
    graceTimer = setTimeout(() => {
      graceTimer = null;
      if (stopped || isRealtimeConnected()) return;
      const tick = async () => {
        if (stopped || isRealtimeConnected()) {
          clearTimers();
          return;
        }
        const response = await getStartupActivities(startupId, { limit: 50 });
        if (!response?.success || !Array.isArray(response.activities)) return;
        emitRows(response.activities);
      };
      void tick();
      pollTimer = setInterval(() => void tick(), ACTIVITY_POLL_MS);
    }, ACTIVITY_POLL_GRACE_MS);
  };

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
    "activity:created",
    (payload) => {
      if (payload?.id) seenIds.add(payload.id);
      onNewActivity(payload);
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

export async function broadcastActivity() {
  return false;
}

// ========================================
// ANNOUNCEMENTS / WINS — not emitted server-side yet
// ========================================

export function subscribeToAnnouncements() {
  return subscribeToStartupAnnouncements(...arguments);
}

export async function broadcastAnnouncementUpdate() {
  return false;
}

const ANNOUNCEMENT_POLL_MS = 30_000;
const ANNOUNCEMENT_POLL_GRACE_MS = 3_000;

export function subscribeToStartupAnnouncements(startupId, onUpdate) {
  let pollTimer = null;
  let graceTimer = null;
  let stopped = false;
  const seenIds = new Set();
  const socket = SocketEngine.getSocket();

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

  const emitRows = (rows = []) => {
    rows.forEach((row) => {
      const id = String(row?.id || row?._id || "");
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      onUpdate({ action: "created", announcement: row });
    });
  };

  const armPollingIfNeeded = () => {
    if (stopped || isRealtimeConnected()) return;
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
          const result = await getStartupAnnouncements(startupId);
          if (!result?.success || !Array.isArray(result.announcements)) return;
          emitRows(result.announcements);
        } catch {
          /* fallback best effort */
        }
      };
      void tick();
      pollTimer = setInterval(() => void tick(), ANNOUNCEMENT_POLL_MS);
    }, ANNOUNCEMENT_POLL_GRACE_MS);
  };

  const onConnect = () => clearTimers();
  const onDisconnect = () => armPollingIfNeeded();
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);

  const coreUnsub = createSubscription(
    announcementSocketRoom(startupId),
    "announcement:created",
    (announcement) => {
      if (announcement?.id) seenIds.add(String(announcement.id));
      onUpdate({ action: "created", announcement });
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

export function subscribeToWins() {
  return subscribeToStartupWins(...arguments);
}

export async function broadcastWinUpdate() {
  return false;
}

const WIN_POLL_MS = 30_000;
const WIN_POLL_GRACE_MS = 3_000;

export function subscribeToStartupWins(startupId, onUpdate) {
  let pollTimer = null;
  let graceTimer = null;
  let stopped = false;
  const seenIds = new Set();
  const socket = SocketEngine.getSocket();

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

  const emitRows = (rows = []) => {
    for (const row of rows) {
      if (!row?.id || seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      onUpdate({ action: "created", win: row });
    }
  };

  const armPollingIfNeeded = () => {
    if (stopped || isRealtimeConnected()) return;
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
          const result = await getStartupWins(startupId, { limit: 50 });
          if (!result?.success || !Array.isArray(result.wins)) return;
          emitRows(result.wins);
        } catch {
          /* fallback best effort */
        }
      };
      void tick();
      pollTimer = setInterval(() => void tick(), WIN_POLL_MS);
    }, WIN_POLL_GRACE_MS);
  };

  const onConnect = () => clearTimers();
  const onDisconnect = () => armPollingIfNeeded();
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);

  const coreUnsub = createSubscription(
    startupSocketRoom(startupId),
    "win:created",
    (win) => {
      if (win?.id) seenIds.add(win.id);
      onUpdate({ action: "created", win });
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

// ========================================
// POLLS — poll:created / poll:updated
// ========================================

export function subscribeToPolls(startupId, onUpdate) {
  const socket = SocketEngine.getSocket();
  const roomId = startupSocketRoom(startupId);

  const onCreated = (poll) => {
    if (poll?.id) onUpdate({ action: "created", poll });
  };
  const onUpdated = (poll) => {
    if (poll?.id) onUpdate({ action: "updated", poll });
  };

  joinRoom(roomId);
  socket.on("poll:created", onCreated);
  socket.on("poll:updated", onUpdated);

  return () => {
    socket.off("poll:created", onCreated);
    socket.off("poll:updated", onUpdated);
    leaveRoom(roomId);
  };
}

// ========================================
// PRESENCE — presence:updated / presence:removed
// ========================================

export function registerPresenceSocket(startupId, userId) {
  const socket = SocketEngine.getSocket();
  const roomId = startupSocketRoom(startupId);
  if (userId) {
    socket.emit("presence:register", {
      startupId: String(startupId),
      userId: String(userId),
    });
  }
  joinRoom(roomId);
}

/** @deprecated Use acquirePresenceFeed from domains/presence/presenceSync.js */
export function subscribeToPresence(startupId, userId, _userName, onPresenceChange) {
  registerPresenceSocket(startupId, userId);

  const refresh = async () => {
    const result = await getActiveUsers(startupId);
    if (result?.success) onPresenceChange(result.presence || []);
  };

  const stopListening = listenForPresenceChanges(() => {
    void refresh();
  });

  void refresh();

  return () => {
    stopListening();
    leaveRoom(startupSocketRoom(startupId));
  };
}

// ========================================
// CALLS — call:started / call:ended
// ========================================

export function subscribeToCallEvents({
  currentUserId,
  startupId,
  onStarted,
  onEnded,
  onInvited,
} = {}) {
  const socket = SocketEngine.getSocket();
  const currentId = String(currentUserId || "");
  const scopedStartupId = startupId ? String(startupId) : "";
  const userRoomId = currentId ? userSocketRoom(currentId) : null;
  const startupRoomId = scopedStartupId ? startupSocketRoom(scopedStartupId) : null;

  const matchesStartup = (payload) => {
    const payloadStartupId = String(payload?.startupId || "");
    if (!payloadStartupId) return true;
    if (!scopedStartupId) return true;
    return payloadStartupId === scopedStartupId;
  };

  const handleStarted = (payload) => {
    if (!matchesStartup(payload)) return;
    const initiatorId = String(payload?.initiatorId || "");
    if (currentId && initiatorId === currentId) return;
    onStarted?.(payload);
  };

  const handleEnded = (payload) => {
    if (!matchesStartup(payload)) return;
    onEnded?.(payload);
  };

  const handleInvited = (payload) => {
    onInvited?.(payload);
  };

  if (userRoomId) {
    joinRoom(userRoomId);
  }
  if (startupRoomId) {
    joinRoom(startupRoomId);
  }

  socket.on("call:started", handleStarted);
  socket.on("call:ended", handleEnded);
  socket.on("call:invited", handleInvited);

  return () => {
    socket.off("call:started", handleStarted);
    socket.off("call:ended", handleEnded);
    socket.off("call:invited", handleInvited);
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

// ========================================
// INTERESTS — interest:created / interest:updated
// ========================================

export function subscribeToInterests(userId, onUpdate) {
  const socket = SocketEngine.getSocket();
  const roomId = userSocketRoom(userId);

  const onCreated = (payload) => {
    if (payload?.interest) onUpdate({ action: "created", interest: payload.interest });
  };
  const onUpdated = (payload) => {
    if (payload?.interest) onUpdate({ action: "updated", interest: payload.interest });
  };

  joinRoom(roomId);
  socket.on("interest:created", onCreated);
  socket.on("interest:updated", onUpdated);

  return () => {
    socket.off("interest:created", onCreated);
    socket.off("interest:updated", onUpdated);
    leaveRoom(roomId);
  };
}

// ========================================
// INVITATIONS — invitation:created / invitation:updated
// ========================================

export function subscribeToInvitations(userId, onUpdate) {
  const socket = SocketEngine.getSocket();
  const roomId = userSocketRoom(userId);

  const onCreated = (payload) => {
    if (payload?.invitation) onUpdate({ action: "created", invitation: payload.invitation });
  };
  const onUpdated = (payload) => {
    if (payload?.invitation) onUpdate({ action: "updated", invitation: payload.invitation });
  };

  joinRoom(roomId);
  socket.on("invitation:created", onCreated);
  socket.on("invitation:updated", onUpdated);

  return () => {
    socket.off("invitation:created", onCreated);
    socket.off("invitation:updated", onUpdated);
    leaveRoom(roomId);
  };
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
