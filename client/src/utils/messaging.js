// Team Messaging Utilities - Real Backend Integration

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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

  // 🔧 FIX: Save to localStorage FIRST for instant local updates
  try {
    const localStorageKey = `messages_${startupId}_${senderId}_${recipientId}`;
    const existingMessages = JSON.parse(
      localStorage.getItem(localStorageKey) || "[]",
    );
    existingMessages.push(message);
    localStorage.setItem(localStorageKey, JSON.stringify(existingMessages));

    // Also save to the reverse key for the recipient's view
    const reverseKey = `messages_${startupId}_${recipientId}_${senderId}`;
    const recipientMessages = JSON.parse(
      localStorage.getItem(reverseKey) || "[]",
    );
    recipientMessages.push(message);
    localStorage.setItem(reverseKey, JSON.stringify(recipientMessages));
  } catch (e) {
    console.warn("Failed to save message to localStorage:", e);
  }

  // Then send to backend
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${API_BASE}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify({
        senderId,
        senderName,
        senderRole,
        recipientId,
        recipientName,
        content,
        startupId,
        isTeamMessage,
        fileUrl,
        fileName,
        fileSize,
        fileType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      console.error("Error sending message to backend:", error);
      // Still return the local message since it's saved to localStorage
      return message;
    }

    const data = await response.json();
    console.log("✅ Message sent successfully to backend");
    return data.message;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(
        "⚠️ Message send timed out after 15 seconds, using localStorage",
      );
    } else {
      console.error("Error sending message to backend:", error);
    }
    // Still return the local message since it's saved to localStorage
    return message;
  }
}

// Get conversation between two users or team chat
export async function getConversation(userId, otherUserId, startupId) {
  try {
    const response = await fetch(
      `${API_BASE}/messages/conversation/${startupId}/${userId}/${otherUserId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
      },
    );

    if (!response.ok) {
      // 🔧 FIX: Use debug log instead of warn - fallback is working fine
      if (process.env.NODE_ENV === "development") {
        console.debug("⚠️ Server unavailable, using localStorage fallback");
      }
      return getMessagesFromLocalStorage(userId, otherUserId, startupId);
    }

    // Check if response is JSON (not HTML error page)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      if (process.env.NODE_ENV === "development") {
        console.debug("⚠️ Server returned HTML, using localStorage fallback");
      }
      return getMessagesFromLocalStorage(userId, otherUserId, startupId);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    // 🔧 FIX: Silent fallback - no need to spam console
    if (process.env.NODE_ENV === "development") {
      console.debug("⚠️ Conversation fetch failed, using localStorage");
    }
    return getMessagesFromLocalStorage(userId, otherUserId, startupId);
  }
}

// Get all conversations for a user
export async function getUserConversations(userId, startupId, teamMembers) {
  try {
    const response = await fetch(
      `${API_BASE}/messages/conversations/${startupId}/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
      },
    );

    if (!response.ok) {
      // 🔧 FIX: Silent fallback - server is optional
      if (process.env.NODE_ENV === "development") {
        console.debug("⚠️ Server unavailable, using localStorage");
      }
      return getConversationsFromLocalStorage(userId, startupId, teamMembers);
    }

    // Check if response is JSON (not HTML error page)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      if (process.env.NODE_ENV === "development") {
        console.debug("⚠️ Server returned HTML, using localStorage");
      }
      return getConversationsFromLocalStorage(userId, startupId, teamMembers);
    }

    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    // 🔧 FIX: Silent fallback - no console spam
    if (process.env.NODE_ENV === "development") {
      console.debug("⚠️ Conversations fetch failed, using localStorage");
    }
    return getConversationsFromLocalStorage(userId, startupId, teamMembers);
  }
}

// Mark messages as read
export async function markMessagesAsRead(userId, otherUserId, startupId) {
  try {
    const response = await fetch(`${API_BASE}/messages/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify({
        userId,
        otherUserId,
        startupId,
      }),
    });

    if (!response.ok) {
      // 🔧 FIX: Silent failure - marking as read is non-critical
      return;
    }

    console.log("✅ Messages marked as read");
  } catch (error) {
    // 🔧 FIX: Silent failure - non-critical operation
    return;
  }
}

// Get unread message count for a user
export async function getUnreadCount(userId, startupId) {
  try {
    const response = await fetch(
      `${API_BASE}/messages/unread-count/${startupId}/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      // Debug log only - backend is optional in demo mode
      if (process.env.NODE_ENV === "development") {
        console.debug("Backend unread count fetch failed:", error);
      }
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
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
export async function uploadMessageFile(file, startupId, senderId) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("startupId", startupId);
    formData.append("senderId", senderId);

    const response = await fetch(`${API_BASE}/messages/upload-file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error uploading file:", error);
      return null;
    }

    const data = await response.json();
    return {
      url: data.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
  } catch (error) {
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
