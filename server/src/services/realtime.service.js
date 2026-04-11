import { getSocketServer } from "../realtime/socketServer.js";

export function emitRealtime(eventName, payload, rooms = []) {
  const io = getSocketServer();

  if (!io) {
    return;
  }

  if (!Array.isArray(rooms) || rooms.length === 0) {
    io.emit(eventName, payload);
    return;
  }

  rooms.forEach((room) => {
    io.to(room).emit(eventName, payload);
  });
}