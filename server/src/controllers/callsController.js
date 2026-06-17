import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import User from "../models/User.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
import { emitRealtime } from "../services/realtime.service.js";
import {
  getClientStartupBucketId,
  resolveUserStartupScope,
  usersShareStartupScope,
} from "../utils/startupScope.js";

const VALID_CALL_TYPES = new Set(["voice", "video"]);

/** @type {Map<string, { callType: string, startupId: string, initiatorId: string }>} */
const callRoomRegistry = new Map();

function isCallRoomName(roomName) {
  return String(roomName || "").startsWith("call-");
}

function getCallRoomMeta(roomName) {
  return callRoomRegistry.get(String(roomName || "")) || null;
}

function setCallRoomMeta(roomName, meta) {
  callRoomRegistry.set(String(roomName), meta);
}

function clearCallRoomMeta(roomName) {
  callRoomRegistry.delete(String(roomName || ""));
}

function getLiveKitCredentials() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    throw new Error("LiveKit credentials are not configured.");
  }

  return { apiKey, apiSecret, livekitUrl };
}

function getRoomServiceHost(livekitUrl) {
  return String(livekitUrl || "")
    .replace(/^wss:\/\//i, "https://")
    .replace(/^ws:\/\//i, "http://");
}

async function getAuthenticatedUser(req) {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    throw new Error("Authenticated user is missing.");
  }

  const user = await User.findById(userId).select("_id name startupId founderId role");
  if (!user) {
    throw new Error("Authenticated user was not found.");
  }

  return user;
}

async function createAccessTokenForUser(user, roomName) {
  const { apiKey, apiSecret } = getLiveKitCredentials();
  const token = new AccessToken(apiKey, apiSecret, {
    identity: user._id.toString(),
    name: user.name,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}

function createRoomServiceClient() {
  const { apiKey, apiSecret, livekitUrl } = getLiveKitCredentials();
  return new RoomServiceClient(getRoomServiceHost(livekitUrl), apiKey, apiSecret);
}

function emitStartupCallEvent(eventName, payload, startupId) {
  const normalizedStartupId = String(startupId || "");
  if (!normalizedStartupId) {
    console.warn(`Skipped ${eventName} emit — missing startupId`);
    return;
  }

  emitRealtime(
    eventName,
    { ...payload, startupId: normalizedStartupId },
    [startupRoom(normalizedStartupId)],
  );
}

function emitToUser(req, userId, eventName, payload) {
  const io = req.app.get("io");
  if (io && typeof io.to === "function") {
    io.to(userRoom(userId)).emit(eventName, payload);
  }
}

function sendControllerError(res, error) {
  return res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : "Call request failed.",
  });
}

export async function createCall(req, res) {
  try {
    const callType = String(req.body?.callType || "").trim().toLowerCase();

    if (!VALID_CALL_TYPES.has(callType)) {
      return res.status(400).json({
        success: false,
        error: "callType must be either voice or video.",
      });
    }

    const user = await getAuthenticatedUser(req);
    const roomName = `call-${Date.now()}-${user._id}`;
    const jwt = await createAccessTokenForUser(user, roomName);

    const scope = await resolveUserStartupScope(user);
    const startupId = getClientStartupBucketId(scope);
    const initiatorId = String(user._id);

    setCallRoomMeta(roomName, {
      callType,
      startupId,
      initiatorId,
    });

    emitStartupCallEvent("call:started", {
      roomName,
      callType,
      initiatorId,
      initiatorName: user.name,
    }, startupId);

    return res.json({
      success: true,
      roomName,
      token: jwt,
      callType,
      initiatorId,
      startupId,
    });
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function joinCall(req, res) {
  try {
    const roomName = String(req.params?.roomName || "").trim();
    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: "roomName is required.",
      });
    }

    if (!isCallRoomName(roomName)) {
      return res.status(400).json({
        success: false,
        error: "Invalid call room.",
      });
    }

    const user = await getAuthenticatedUser(req);
    const jwt = await createAccessTokenForUser(user, roomName);
    const meta = getCallRoomMeta(roomName);

    return res.json({
      success: true,
      roomName,
      token: jwt,
      callType: meta?.callType || "video",
    });
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function getActiveCalls(_req, res) {
  try {
    const roomService = createRoomServiceClient();
    const rooms = await roomService.listRooms();
    const calls = rooms
      .filter((room) => String(room.name || "").startsWith("call-"))
      .map((room) => ({
        roomName: room.name,
        participantCount: room.numParticipants,
        createdAt: room.creationTime,
      }));

    return res.json({
      success: true,
      calls,
    });
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function endCall(req, res) {
  try {
    const roomName = String(req.params?.roomName || "").trim();
    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: "roomName is required.",
      });
    }

    const meta = getCallRoomMeta(roomName);
    const roomService = createRoomServiceClient();
    await roomService.deleteRoom(roomName);

    clearCallRoomMeta(roomName);

    emitStartupCallEvent(
      "call:ended",
      { roomName },
      meta?.startupId || "",
    );

    return res.json({ success: true });
  } catch (error) {
    return sendControllerError(res, error);
  }
}

async function roomExists(roomName) {
  const roomService = createRoomServiceClient();
  const rooms = await roomService.listRooms();
  return rooms.some((room) => room.name === roomName);
}

export async function inviteToCall(req, res) {
  try {
    const roomName = String(req.params?.roomName || "").trim();
    const inviteeUserId = String(req.body?.inviteeUserId || "").trim();

    if (!roomName || !isCallRoomName(roomName)) {
      return res.status(400).json({
        success: false,
        error: "A valid call room name is required.",
      });
    }

    if (!inviteeUserId) {
      return res.status(400).json({
        success: false,
        error: "inviteeUserId is required.",
      });
    }

    const inviter = await getAuthenticatedUser(req);

    if (String(inviter._id) === inviteeUserId) {
      return res.status(403).json({
        success: false,
        error: "You cannot invite yourself.",
      });
    }

    const invitee = await User.findById(inviteeUserId).select("_id name startupId founderId role");
    if (!invitee) {
      return res.status(404).json({
        success: false,
        error: "Invitee was not found.",
      });
    }

    const sharesStartup = await usersShareStartupScope(inviter, invitee);
    if (!sharesStartup) {
      return res.status(403).json({
        success: false,
        error: "You can only invite members of your startup.",
      });
    }

    const inviterScope = await resolveUserStartupScope(inviter);
    const inviterStartupId = getClientStartupBucketId(inviterScope);

    const meta = getCallRoomMeta(roomName);
    if (!meta) {
      const exists = await roomExists(roomName);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: "Call room was not found.",
        });
      }
    } else if (meta.startupId && meta.startupId !== inviterStartupId) {
      return res.status(403).json({
        success: false,
        error: "You cannot invite to this call.",
      });
    }

    const callType = meta?.callType || "video";

    emitToUser(req, inviteeUserId, "call:invited", {
      roomName,
      callType,
      initiatorId: String(inviter._id),
      initiatorName: inviter.name,
      invited: true,
    });

    return res.json({ success: true });
  } catch (error) {
    return sendControllerError(res, error);
  }
}
