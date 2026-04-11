import { Server } from "socket.io";
import { logger } from "../config/logger.js";

let ioInstance;

export function initSocketServer(httpServer, corsOptions) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: corsOptions.credentials,
    },
  });

  ioInstance.on("connection", (socket) => {
    logger.info("Socket client connected.", { socketId: socket.id });

    function joinRoom(roomName) {
      if (typeof roomName === "string" && roomName.trim().length > 0) {
        socket.join(roomName);
      }
    }

    function leaveRoom(roomName) {
      if (typeof roomName === "string" && roomName.trim().length > 0) {
        socket.leave(roomName);
      }
    }

    socket.on("room:join", joinRoom);
    socket.on("room:leave", leaveRoom);
    socket.on("join_room", joinRoom);
    socket.on("leave_room", leaveRoom);

    socket.on("disconnect", () => {
      logger.debug("Socket client disconnected.", { socketId: socket.id });
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}