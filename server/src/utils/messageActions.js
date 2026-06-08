import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { mapMessageDto } from "./messageDto.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom, organizationRoom } from "../realtime/rooms.js";
import { normalizeAttachments } from "./messageAttachments.js";

export const DELETE_FOR_EVERYONE_WINDOW_MS = 48 * 60 * 60 * 1000;

const SNIPPET_MAX = 120;

export function bodySnippet(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  return t.length <= SNIPPET_MAX ? t : `${t.slice(0, SNIPPET_MAX)}…`;
}

export function isMessageParticipant(message, userId) {
  if (!message || !userId) return false;
  const uid = String(userId);
  return (
    String(message.fromUserId) === uid || String(message.toUserId) === uid
  );
}

export function conversationVisibilityFilter(viewerUserId) {
  const viewerOid = new mongoose.Types.ObjectId(String(viewerUserId));
  return { hiddenForUserIds: { $nin: [viewerOid] } };
}

export function getMessageRealtimeRooms(message) {
  const rooms = [];
  const isDirectPeer =
    Boolean(message.toUserId) &&
    Boolean(message.fromUserId) &&
    String(message.toUserId) !== String(message.fromUserId);
  if (message.organizationId) {
    rooms.push(organizationRoom(message.organizationId));
  }
  if (message.startupId && !isDirectPeer) {
    rooms.push(startupRoom(message.startupId));
  }
  rooms.push(userRoom(message.fromUserId));
  rooms.push(userRoom(message.toUserId));
  return [...new Set(rooms.filter(Boolean))];
}

export function emitMessageUpdated(messageDoc) {
  const dto = mapMessageDto(messageDoc);
  const rooms = getMessageRealtimeRooms(messageDoc);
  emitRealtime(SOCKET_EVENTS.MESSAGE_UPDATED, dto, rooms);
}

export async function loadMessageById(messageId) {
  if (!messageId || !mongoose.Types.ObjectId.isValid(String(messageId))) {
    return null;
  }
  return Message.findById(messageId);
}

export async function resolveReplyPreview(replyToMessageId, viewerUserId) {
  const parent = await loadMessageById(replyToMessageId);
  if (!parent || !isMessageParticipant(parent, viewerUserId)) {
    return null;
  }
  const deleted = Boolean(parent.deletedForEveryoneAt);
  const hasAttachment = Array.isArray(parent.attachments) && parent.attachments.length > 0;
  let senderName = "";
  try {
    const sender = await User.findById(parent.fromUserId, { name: 1 });
    senderName = sender?.name || "";
  } catch {
    /* optional */
  }
  return {
    messageId: parent._id,
    senderId: parent.fromUserId,
    senderName,
    bodySnippet: deleted ? "" : bodySnippet(parent.body),
    hasAttachment: deleted ? false : hasAttachment,
    deletedForEveryone: deleted,
  };
}

export function buildForwardedFromSnapshot(sourceMessage, fromUserName = "") {
  const deleted = Boolean(sourceMessage.deletedForEveryoneAt);
  const attachments = deleted
    ? []
    : normalizeAttachments(sourceMessage.attachments || []);
  return {
    messageId: sourceMessage._id,
    fromUserId: sourceMessage.fromUserId,
    fromUserName: String(fromUserName || ""),
    bodySnippet: deleted ? "" : bodySnippet(sourceMessage.body),
    attachments,
  };
}

export function canDeleteForEveryone(message, userId) {
  if (!message || message.messageType !== "dm") return false;
  if (String(message.fromUserId) !== String(userId)) return false;
  if (message.deletedForEveryoneAt) return false;
  const created = message.createdAt ? new Date(message.createdAt).getTime() : 0;
  return Date.now() - created <= DELETE_FOR_EVERYONE_WINDOW_MS;
}
