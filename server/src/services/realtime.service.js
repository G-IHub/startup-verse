import { getSocketServer } from "../realtime/socketServer.js";

/** @returns {boolean} true if emit attempted on a live socket server */
export function emitRealtime(eventName, payload, rooms = []) {
  const io = getSocketServer();

  if (!io) {
    return false;
  }

  if (!Array.isArray(rooms) || rooms.length === 0) {
    io.emit(eventName, payload);
    return true;
  }

  rooms.forEach((room) => {
    io.to(room).emit(eventName, payload);
  });
  return true;
}