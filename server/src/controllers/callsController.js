import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import User from "../models/User.js";

const VALID_CALL_TYPES = new Set(["voice", "video"]);

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

  const user = await User.findById(userId).select("_id name");
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

function emitCallEvent(req, eventName, payload) {
  const io = req.app.get("io");
  if (io && typeof io.emit === "function") {
    io.emit(eventName, payload);
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

    emitCallEvent(req, "call:started", {
      roomName,
      callType,
      initiatorId: user._id,
      initiatorName: user.name,
    });

    return res.json({
      success: true,
      roomName,
      token: jwt,
      callType,
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

    const user = await getAuthenticatedUser(req);
    const jwt = await createAccessTokenForUser(user, roomName);

    return res.json({
      success: true,
      roomName,
      token: jwt,
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

    const roomService = createRoomServiceClient();
    await roomService.deleteRoom(roomName);

    emitCallEvent(req, "call:ended", { roomName });

    return res.json({ success: true });
  } catch (error) {
    return sendControllerError(res, error);
  }
}
