// Team Messaging Utilities - Real Backend Integration

import { API_BASE_URL } from "../config/apiBase.js";
import { request } from "./backendClient";
import { uploadFile } from "./api/uploadApi.js";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

const API_BASE = API_BASE_URL;

function mapMessageDto(row) {
  if (!row) return null;
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  const firstAtt = attachments[0] && typeof attachments[0] === "object" ? attachments[0] : null;
  const fileUrl = row.fileUrl || firstAtt?.url || "";
  const fileName = row.fileName || firstAtt?.fileName || "";
  const fileSize = row.fileSize ?? firstAtt?.fileSize ?? 0;
  const fileType = row.fileType || firstAtt?.fileType || "";
  return {
    id: String(row.id || row._id || ""),
    senderId: String(row.senderId || row.fromUserId || ""),
    senderName: String(row.senderName || ""),
    senderRole: String(row.senderRole || ""),
    recipientId: String(row.recipientId || row.toUserId || ""),
    recipientName: String(row.recipientName || ""),
    content: String(row.content || row.body || ""),
    timestamp: row.timestamp ? Number(row.timestamp) : new Date(row.createdAt || Date.now()).getTime(),
    startupId: String(row.startupId || ""),
    read: Boolean(row.read || row.readAt),
    fileUrl,
    fileName,
    fileSize,
    fileType,
    createdAt: row.createdAt || null,
  };
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
    const payload = await request("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        startupId,
        toUserId: recipientId,
        body: content,
        attachments: fileUrl
          ? [{ url: fileUrl, fileName, fileSize, fileType }]
          : [],
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
        lastMessage: row.content || "",
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
    const result = await uploadFile(file, "messages");
    return {
      url: result?.url || "",
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

