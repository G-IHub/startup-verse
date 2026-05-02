// Team Messaging Utilities - Real Backend Integration

import { API_BASE_URL } from "../config/apiBase.js";
import { request } from "./backendClient";

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

  if (!options?.strict) {
    try {
      const localStorageKey = `messages_${startupId}_${senderId}_${recipientId}`;
      const existingMessages = JSON.parse(
        localStorage.getItem(localStorageKey) || "[]",
      );
      existingMessages.push(message);
      localStorage.setItem(localStorageKey, JSON.stringify(existingMessages));

      const reverseKey = `messages_${startupId}_${recipientId}_${senderId}`;
      const recipientMessages = JSON.parse(
        localStorage.getItem(reverseKey) || "[]",
      );
      recipientMessages.push(message);
      localStorage.setItem(reverseKey, JSON.stringify(recipientMessages));
    } catch (e) {
      console.warn("Failed to save message to localStorage:", e);
    }
  }

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
      console.debug("Message send fallback to localStorage:", error?.message);
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
      console.debug("⚠️ Conversation fetch failed, using localStorage");
    }
    return getMessagesFromLocalStorage(userId, otherUserId, startupId);
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
      console.debug("⚠️ Conversations fetch failed, using localStorage");
    }
    return getConversationsFromLocalStorage(userId, startupId, teamMembers);
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

// Upload file to the messaging API (multipart)
export async function uploadMessageFile(file, startupId, senderId, options = {}) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("startupId", startupId);
    formData.append("senderId", senderId);

    const response = await fetch(`${API_BASE}/messages/upload-file`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error uploading file:", error);
      return null;
    }

    const data = await response.json();
    return {
      url: data?.data?.fileUrl || data?.fileUrl || data?.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
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

// LocalStorage fallback for conversations
function getConversationsFromLocalStorage(userId, startupId, teamMembers) {
  // 🔧 FIX: Build conversations from actual messages, not just teamMembers array
  // This ensures founders see conversations with team members who have sent them messages

  // Get all messages for this startup from localStorage
  const allMessages = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Check for both old format (startupverse_messages_) and new format (messages_)
    if (
      key &&
      (key.startsWith(`messages_${startupId}_`) ||
        key.includes(`_${startupId}_`))
    ) {
      try {
        const messages = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(messages)) {
          allMessages.push(
            ...messages.filter((m) => m && m.startupId === startupId),
          );
        }
      } catch (e) {
        // Skip invalid entries
      }
    }
  }

  console.log(
    `🔍 [LocalStorage] Found ${allMessages.length} messages for startup ${startupId}, user ${userId}`,
  );

  // Filter messages that involve this user
  const userMessages = allMessages.filter(
    (msg) =>
      msg &&
      (msg.senderId === userId ||
        msg.recipientId === userId ||
        msg.isTeamMessage),
  );

  console.log(
    `🔍 [LocalStorage] Filtered to ${userMessages.length} messages involving user ${userId}`,
  );

  // Build conversation map
  const conversationMap = new Map();

  // Team messages
  const teamMessages = userMessages.filter((msg) => msg && msg.isTeamMessage);
  if (teamMessages.length > 0) {
    const lastTeamMsg = teamMessages[teamMessages.length - 1];
    const unreadTeamCount = teamMessages.filter(
      (msg) => msg && !msg.read && msg.senderId !== userId,
    ).length;

    conversationMap.set(`team-${startupId}`, {
      userId: `team-${startupId}`,
      userName: "Team Chat",
      userRole: "Team",
      lastMessage: lastTeamMsg.content || "",
      lastMessageTime: lastTeamMsg.timestamp || 0,
      unreadCount: unreadTeamCount,
      isTeamChat: true,
    });
  } else {
    // Add empty team chat even if no messages
    conversationMap.set(`team-${startupId}`, {
      userId: `team-${startupId}`,
      userName: "Team Chat",
      userRole: "Team",
      lastMessage: "",
      lastMessageTime: 0,
      unreadCount: 0,
      isTeamChat: true,
    });
  }

  // Direct messages - build from actual messages
  userMessages
    .filter((msg) => msg && !msg.isTeamMessage)
    .forEach((msg) => {
      if (!msg) return;

      const otherUserId =
        msg.senderId === userId ? msg.recipientId : msg.senderId;
      const otherUserName =
        msg.senderId === userId
          ? msg.recipientName || "Unknown"
          : msg.senderName || "Unknown";
      const otherUserRole = msg.senderId === userId ? "" : msg.senderRole || "";

      if (!otherUserId) return;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          userRole: otherUserRole,
          lastMessage: "",
          lastMessageTime: 0,
          unreadCount: 0,
          isTeamChat: false,
        });
      }

      const conversation = conversationMap.get(otherUserId);
      if (
        conversation &&
        typeof msg.timestamp === "number" &&
        msg.timestamp > conversation.lastMessageTime
      ) {
        conversation.lastMessage = msg.content || "";
        conversation.lastMessageTime = msg.timestamp;
      }

      if (conversation && !msg.read && msg.recipientId === userId) {
        conversation.unreadCount++;
      }
    });

  console.log(
    `🔍 [LocalStorage] Built ${conversationMap.size - 1} direct conversations (+ team chat)`,
  );

  // Also add team members who don't have messages yet (for new conversations)
  teamMembers.forEach((member) => {
    if (!conversationMap.has(member.id)) {
      conversationMap.set(member.id, {
        userId: member.id,
        userName: member.name,
        userRole: member.role,
        lastMessage: "",
        lastMessageTime: 0,
        unreadCount: 0,
        isTeamChat: false,
      });
    }
  });

  // Convert to array and sort by last message time
  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => b.lastMessageTime - a.lastMessageTime,
  );

  console.log(
    `🔍 [LocalStorage] Returning ${conversations.length} total conversations`,
  );
  return conversations;
}

// LocalStorage fallback for messages
function getMessagesFromLocalStorage(userId, otherUserId, startupId) {
  // 🔧 FIX: Check BOTH directions to ensure founders see messages from team members
  const keyDirection1 = `messages_${startupId}_${userId}_${otherUserId}`;
  const keyDirection2 = `messages_${startupId}_${otherUserId}_${userId}`;

  const messages1 = localStorage.getItem(keyDirection1);
  const messages2 = localStorage.getItem(keyDirection2);

  const allMessages = [];

  if (messages1) {
    try {
      const parsed = JSON.parse(messages1);
      if (Array.isArray(parsed)) {
        allMessages.push(...parsed);
      }
    } catch (e) {
      console.error("Error parsing messages from direction 1:", e);
    }
  }

  if (messages2) {
    try {
      const parsed = JSON.parse(messages2);
      if (Array.isArray(parsed)) {
        allMessages.push(...parsed);
      }
    } catch (e) {
      console.error("Error parsing messages from direction 2:", e);
    }
  }

  // Deduplicate by message ID and sort by timestamp
  const uniqueMessages = Array.from(
    new Map(allMessages.map((msg) => [msg.id, msg])).values(),
  ).sort((a, b) => a.timestamp - b.timestamp);

  console.log(
    `📥 [LocalStorage] Loaded ${uniqueMessages.length} messages between ${userId} and ${otherUserId} (${allMessages.length} total from both directions)`,
  );

  return uniqueMessages;
}
