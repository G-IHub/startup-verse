import { Server } from "socket.io";
import { logger } from "../config/logger.js";
import { startupRoom } from "./rooms.js";

let ioInstance;

/** socket.id -> { userId, startupId } */
const socketPresenceRegistry = new Map();

function parseStartupRoom(roomName) {
  if (typeof roomName !== "string" || !roomName.startsWith("startup:")) {
    return null;
  }
  const startupId = roomName.slice("startup:".length).trim();
  return startupId || null;
}

function registerSocketPresence(socket, startupId, userId) {
  const sid = String(startupId || "");
  const uid = String(userId || "");
  if (!sid || !uid) return;
  socketPresenceRegistry.set(socket.id, { startupId: sid, userId: uid });
  socket.data.presenceStartupId = sid;
  socket.data.presenceUserId = uid;
}

function clearSocketPresence(socket) {
  socketPresenceRegistry.delete(socket.id);
  delete socket.data.presenceStartupId;
  delete socket.data.presenceUserId;
}

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
        const startupId = parseStartupRoom(roomName);
        if (startupId && socket.data.presenceUserId) {
          registerSocketPresence(socket, startupId, socket.data.presenceUserId);
        }
      }
    }

    function leaveRoom(roomName) {
      if (typeof roomName === "string" && roomName.trim().length > 0) {
        socket.leave(roomName);
      }
    }

    socket.on("presence:register", (payload) => {
      const startupId = String(payload?.startupId || "");
      const userId = String(payload?.userId || "");
      if (!startupId || !userId) return;
      registerSocketPresence(socket, startupId, userId);
      socket.join(startupRoom(startupId));
    });

    socket.on("room:join", joinRoom);
    socket.on("room:leave", leaveRoom);
    socket.on("join_room", joinRoom);
    socket.on("leave_room", leaveRoom);

    socket.on("disconnect", () => {
      clearSocketPresence(socket);
      // Do not mark offline on transient socket disconnect — heartbeats + staleness
      // on GET /presence are the source of truth (avoids online/offline flicker).
      logger.debug("Socket client disconnected.", { socketId: socket.id });
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}
