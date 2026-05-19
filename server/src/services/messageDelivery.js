/**
 * Shared helper for creating a Message and broadcasting the realtime event.
 *
 * Extracted from server/src/routes/messages.routes.js so other controllers
 * (e.g. founder-to-org fan-out) can persist a Message with the same socket
 * fanout semantics without duplicating the room-computation logic.
 */
import Message from "../models/Message.js";
import { emitRealtime } from "./realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom, organizationRoom } from "../realtime/rooms.js";
import { mapMessageDto } from "../utils/messageDto.js";

export async function createMessage(payload) {
  const message = await Message.create(payload);
  emitMessageRealtime(message);
  return message;
}

export function emitMessageRealtime(message) {
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

  const uniqueRooms = [...new Set(rooms.filter(Boolean))];
  emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, mapMessageDto(message), uniqueRooms);
  return uniqueRooms;
}
