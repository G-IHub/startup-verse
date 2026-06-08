// Team Messaging Utilities - Real Backend Integration

import { API_BASE_URL } from "../config/apiBase.js";
import { request } from "./backendClient";
import { uploadFileWithProgress } from "./api/uploadApi.js";
import { resolveMediaUrl } from "./resolveMediaUrl.js";
import { formatConversationPreview } from "./messageAttachmentUtils.js";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

const API_BASE = API_BASE_URL;

export function mapMessageDto(row) {
  if (!row) return null;
  const rawAttachments = Array.isArray(row.attachments) ? row.attachments : [];
  const attachments = rawAttachments
    .filter((a) => a && typeof a === "object" && (a.url || a.fileUrl))
    .map((a) => ({
      url: resolveMediaUrl(String(a.url || a.fileUrl || "")),
      fileName: String(a.fileName || a.name || "file"),
      fileSize: Number(a.fileSize ?? a.size ?? 0) || 0,
      fileType: String(a.fileType || a.mimeType || a.type || ""),
    }));

  if (attachments.length === 0 && row.fileUrl) {
    attachments.push({
      url: resolveMediaUrl(String(row.fileUrl)),
      fileName: String(row.fileName || "file"),
      fileSize: Number(row.fileSize ?? 0) || 0,
      fileType: String(row.fileType || ""),
    });
  }

  const firstAtt = attachments[0] || null;
  const deletedForEveryone = Boolean(row.deletedForEveryone || row.deletedForEveryoneAt);
  const content = deletedForEveryone
    ? ""
    : String(row.content || row.body || "");

  return {
    id: String(row.id || row._id || ""),
    senderId: String(row.senderId || row.fromUserId || ""),
    senderName: String(row.senderName || ""),
    senderRole: String(row.senderRole || ""),
    recipientId: String(row.recipientId || row.toUserId || ""),
    recipientName: String(row.recipientName || ""),
    content,
    timestamp: row.timestamp ? Number(row.timestamp) : new Date(row.createdAt || Date.now()).getTime(),
    startupId: String(row.startupId || ""),
    messageType: String(row.messageType || "dm"),
    read: Boolean(row.read || row.readAt),
    attachments: deletedForEveryone ? [] : attachments,
    fileUrl: deletedForEveryone ? "" : firstAtt?.url || "",
    fileName: deletedForEveryone ? "" : firstAtt?.fileName || "",
    fileSize: deletedForEveryone ? 0 : firstAtt?.fileSize ?? 0,
    fileType: deletedForEveryone ? "" : firstAtt?.fileType || "",
    createdAt: row.createdAt || null,
    replyToMessageId: row.replyToMessageId ? String(row.replyToMessageId) : "",
    replyTo: row.replyTo && typeof row.replyTo === "object" ? row.replyTo : null,
    forwardedFrom:
      row.forwardedFrom && typeof row.forwardedFrom === "object" ? row.forwardedFrom : null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    deletedForEveryone,
    deletedForEveryoneAt: row.deletedForEveryoneAt || null,
    hiddenForUserIds: Array.isArray(row.hiddenForUserIds)
      ? row.hiddenForUserIds.map(String)
      : [],
  };
}

/** Apply socket/API message update to a thread message list. */
export function mergeMessageIntoThread(prev, update, currentUserId) {
  const m = update?.message;
  if (!m?.id) return prev;

  const hidden = Array.isArray(m.hiddenForUserIds)
    ? m.hiddenForUserIds.some((id) => String(id) === String(currentUserId))
    : false;
  if (hidden) {
    return prev.filter((row) => String(row.id) !== String(m.id));
  }

  const byId = new Map(prev.map((row) => [String(row.id), row]));
  byId.set(String(m.id), m);
  return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export const DELETE_FOR_EVERYONE_WINDOW_MS = 48 * 60 * 60 * 1000;

export function canDeleteMessageForEveryone(message, currentUserId) {
  if (!message || message.deletedForEveryone) return false;
  if (String(message.messageType || "dm") !== "dm") return false;
  if (String(message.senderId) !== String(currentUserId)) return false;
  const ts = message.timestamp || (message.createdAt ? new Date(message.createdAt).getTime() : 0);
  return Date.now() - ts <= DELETE_FOR_EVERYONE_WINDOW_MS;
}

export function isServerMessageId(id) {
  return id && !String(id).startsWith("opt-");
}

// Send a new message
export async function sendMessage(
  senderId,
  senderName,
  senderRole,
  recipientId,
  recipientName,
  content,
  startupId,
  isTeamMessage = false,
  fileUrl,
  fileName,
  fileSize,
  fileType,
  options = {},
) {
  // Create message object first
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const message = {
    id: messageId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName: recipientName || "",
    content,
    timestamp: Date.now(),
    startupId,
    isTeamMessage,
    read: false,
    ...(fileUrl && { fileUrl }),
    ...(fileName && { fileName }),
    ...(fileSize && { fileSize }),
    ...(fileType && { fileType }),
  };

  // Then send to backend
  try {
    const attachmentList = Array.isArray(options?.attachments)
      ? options.attachments
      : fileUrl
        ? [{ url: fileUrl, fileName, fileSize, fileType }]
        : [];

    const payload = await request("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        startupId,
        toUserId: recipientId,
        body: content || "",
        attachments: attachmentList,
        ...(options.replyToMessageId
          ? { replyToMessageId: options.replyToMessageId }
          : {}),
        ...(options.forwardedFrom ? { forwardedFrom: options.forwardedFrom } : {}),
        ...(options.metadata && typeof options.metadata === "object"
          ? { metadata: options.metadata }
          : {}),
      }),
    });
    const serverMessage = mapMessageDto(payload?.data || payload?.message);
    return serverMessage || message;
  } catch (error) {
    if (options?.strict) {
      throw error;
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("Message send failed:", error?.message);
    }
    return message;
  }
}

// Get conversation between two users or team chat
export async function getConversation(userId, otherUserId, startupId, options = {}) {
  try {
    const results = [];

    // Always fetch direct (null-startupId) DMs — includes interest origin message
    try {
      const directPayload = await request(
        `/messages/direct/${userId}/${otherUserId}`,
        { method: "GET" },
      );
      const directRows = directPayload?.data || directPayload?.messages || [];
      results.push(...directRows.map(mapMessageDto).filter(Boolean));
    } catch (_) { }

    // Also fetch startup-scoped messages when startupId is present
    if (startupId) {
      try {
        const payload = await request(
          `/messages/conversation/${startupId}/${userId}/${otherUserId}`,
          { method: "GET" },
        );
        const rows = payload?.data || payload?.messages || [];
        results.push(...rows.map(mapMessageDto).filter(Boolean));
      } catch (_) { }
    }

    // De-dup by id, sort chronologically
    const byId = new Map();
    for (const m of results) { if (m?.id) byId.set(m.id, m); }
    return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    if (options?.strict) throw error;
    if (process.env.NODE_ENV === "development") {
      console.debug("⚠️ Conversation fetch failed");
    }
    return [];
  }
}

// Get all conversations for a user
export async function getUserConversations(userId, startupId, teamMembers, options = {}) {
  try {
    let rows = [];

    // 1. Startup-scoped conversations (team members)
    if (startupId) {
      try {
        const payload = await request(`/messages/conversations/${startupId}/${userId}`, {
          method: "GET",
        });
        rows = payload?.data || payload?.conversations || [];
      } catch (err) {
        if (options?.strict) throw err;
      }
    }

    // 2. Direct DMs (pending talents / pre-team conversations)
    try {
      const directPayload = await request(`/messages/${userId}`, { method: "GET" });
      const allDirect = (directPayload?.data || directPayload?.messages || [])
        .map(mapMessageDto)
        .filter(Boolean);

      // De-dup by other-user-id — keep latest
      const directByPeer = new Map();
      for (const m of allDirect) {
        const peerId = String(m.senderId) === String(userId) ? m.recipientId : m.senderId;
        if (!directByPeer.has(peerId) || m.timestamp > directByPeer.get(peerId).timestamp) {
          directByPeer.set(peerId, m);
        }
      }

      for (const [peerId, m] of directByPeer.entries()) {
        // Only include if the peer is in teamMembers (i.e. known to this chat roster)
        const teammate = teamMembers.find((t) => String(t.id) === peerId);
        if (!teammate) continue;
        // Avoid duplicate if already in startup-scoped rows
        const alreadyPresent = rows.some((r) => {
          const mapped = mapMessageDto(r);
          const otherId = String(mapped?.senderId) === String(userId)
            ? mapped?.recipientId
            : mapped?.senderId;
          return otherId === peerId;
        });
        if (!alreadyPresent) rows.push(m);
      }
    } catch (err) {
      // Non-critical — skip direct DM merge on error
    }

    const mapped = (Array.isArray(rows) ? rows : []).map(mapMessageDto).filter(Boolean);
    const entries = mapped.map((row) => {
      const otherId =
        String(row.senderId) === String(userId) ? row.recipientId : row.senderId;
      const teammate = teamMembers.find((m) => String(m.id) === String(otherId));
      return {
        userId: String(otherId),
        userName: teammate?.name || "Team Member",
        userRole: teammate?.role || "team-member",
        lastMessage: formatConversationPreview(row) || row.content || "",
        lastMessageTime: row.timestamp || Date.now(),
        unreadCount: 0,
      };
    });

    // Dedup by peer userId — keep entry with the latest message
    const byPeer = new Map();
    for (const conv of entries) {
      if (!conv.userId) continue;
      const prev = byPeer.get(conv.userId);
      if (!prev || conv.lastMessageTime > prev.lastMessageTime) {
        byPeer.set(conv.userId, conv);
      }
    }
    return Array.from(byPeer.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  } catch (error) {
    if (options?.strict) throw error;
    if (process.env.NODE_ENV === "development") {
      console.debug("⚠️ Conversations fetch failed");
    }
    const roster = Array.isArray(teamMembers) ? teamMembers : [];
    const base = roster.map((member) => ({
      userId: String(member.id),
      userName: member.name || "Team Member",
      userRole: member.role || "team-member",
      lastMessage: "",
      lastMessageTime: 0,
      unreadCount: 0,
    }));
    if (startupId) {
      base.unshift({
        userId: `team-${startupId}`,
        userName: "Team Chat",
        userRole: "Team",
        lastMessage: "",
        lastMessageTime: 0,
        unreadCount: 0,
        isTeamChat: true,
      });
    }
    return base;
  }
}

// Mark messages as read
export async function markMessagesAsRead(userId, otherUserId, startupId) {
  try {
    await request("/messages/mark-read", {
      method: "POST",
      body: JSON.stringify({
        userId,
        otherUserId,
        startupId,
      }),
    });
  } catch (error) {
    return;
  }
}

// Get unread message count for a user
export async function getUnreadCount(userId, startupId) {
  try {
    const payload = await request(`/messages/unread-count/${startupId}/${userId}`, {
      method: "GET",
    });
    const data = payload?.data || payload || {};
    return Number(data.unreadCount ?? data.count ?? 0);
  } catch (error) {
    // Debug log only - backend is optional in demo mode
    if (process.env.NODE_ENV === "development") {
      console.debug("Backend unread count fetch failed:", error.message);
    }
    return 0;
  }
}

// Format timestamp for display
export function formatMessageTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

// Format timestamp for message detail
export function formatMessageTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;

  return `${date.toLocaleDateString()} at ${timeStr}`;
}

// Upload a message attachment through the canonical `POST /uploads`
// endpoint. The previous `/messages/upload-file` stub was retired in Step 2.1;
// this function preserves the existing call sites' return shape but the bytes
// now land in the configured storage driver (Cloudinary or disk).
export async function uploadMessageFile(file, _startupId, _senderId, options = {}) {
  try {
    const result = await uploadFileWithProgress(
      file,
      "messages",
      options?.onProgress,
    );
    const rawUrl = result?.url || "";
    return {
      url: rawUrl,
      key: result?.key || "",
      fileName: file.name,
      fileSize: typeof result?.size === "number" ? result.size : file.size,
      fileType: result?.mimeType || file.type,
    };
  } catch (error) {
    if (options?.strict) throw error;
    console.error("Error uploading file:", error);
    return null;
  }
}

// Format file size for display
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

