import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import { mapActivityToDto } from "../utils/activityDto.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";

const activityRouter = Router();

const isSelfOrAdmin = (req, userId) =>
  req.user?.isAdmin === true || req.user?.id === String(userId);

async function canAccessStartup(req, startupId) {
  const normalize = (value) => String(value || "").trim();
  const resolveCanonicalStartupId = async (rawValue) => {
    const value = normalize(rawValue);
    if (!value) return null;
    const byId = await Startup.findById(value, { _id: 1 });
    if (byId?._id) return String(byId._id);
    const byFounder = await Startup.findOne({ founderId: value }, { _id: 1 });
    return byFounder?._id ? String(byFounder._id) : null;
  };

  const requestedCanonicalId = await resolveCanonicalStartupId(startupId);
  if (!requestedCanonicalId) return null;
  if (req.user?.isAdmin) return requestedCanonicalId;

  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return null;

  const candidateIds = [
    req.user.id,
    me.startupId,
    me.founderId,
  ];
  for (const candidateId of candidateIds) {
    const canonicalCandidate = await resolveCanonicalStartupId(candidateId);
    if (canonicalCandidate && canonicalCandidate === requestedCanonicalId) {
      return requestedCanonicalId;
    }
  }
  return null;
}

activityRouter.get(
  "/startups/:startupId/activities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const canonicalStartupId = await canAccessStartup(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }

    const parsedLimit = Number.parseInt(String(req.query?.limit || "50"), 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
    const limit = Math.max(1, Math.min(200, safeLimit));
    const rows = await Activity.find({ startupId: canonicalStartupId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);
    return apiSuccess(res, rows.map((row) => mapActivityToDto(row)));
  }),
);

activityRouter.get(
  "/startups/:startupId/wins",
  requireAuth,
  asyncHandler(async (req, res) => {
    const canonicalStartupId = await canAccessStartup(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }
    const parsedLimit = Number.parseInt(String(req.query?.limit || "50"), 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
    const limit = Math.max(1, Math.min(200, safeLimit));
    const rows = await Activity.find({ startupId: canonicalStartupId, type: "win" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);
    return apiSuccess(res, rows.map((row) => mapActivityToDto(row)));
  }),
);

activityRouter.post(
  "/startups/:startupId/activities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const canonicalStartupId = await canAccessStartup(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }

    const userId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }

    const message = String(req.body?.message || "").trim();
    if (!message) {
      return apiError(res, "message is required.", 400);
    }

    const type = String(req.body?.type || "update");
    const actor = await User.findById(req.user.id, { name: 1, displayName: 1 });
    const metadata =
      req.body?.metadata && typeof req.body.metadata === "object"
        ? req.body.metadata
        : {};
    const trustedUserName = String(
      actor?.displayName || actor?.name || req.user?.name || req.user?.email || "",
    );
    const trustedIcon = "📋";
    const doc = await Activity.create({
      startupId: canonicalStartupId,
      userId: String(userId),
      type,
      text: message,
      metadata: {
        ...metadata,
        userName: trustedUserName,
        icon: trustedIcon,
      },
    });
    const activity = mapActivityToDto(doc);
    emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activity, [startupRoom(canonicalStartupId)]);
    return apiSuccess(res, activity, 201);
  }),
);

activityRouter.post(
  "/startups/:startupId/wins",
  requireAuth,
  asyncHandler(async (req, res) => {
    const canonicalStartupId = await canAccessStartup(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }
    const userId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return apiError(res, "message is required.", 400);
    }
    const actor = await User.findById(req.user.id, { name: 1, displayName: 1 });
    const doc = await Activity.create({
      startupId: canonicalStartupId,
      userId: String(userId),
      type: "win",
      text: message,
      metadata: {
        userName: String(
          actor?.displayName || actor?.name || req.user?.name || req.user?.email || "",
        ),
        icon: "🏆",
        category: "wall-of-wins",
      },
    });
    const activity = mapActivityToDto(doc);
    emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activity, [startupRoom(canonicalStartupId)]);
    emitRealtime(SOCKET_EVENTS.WIN_CREATED, activity, [startupRoom(canonicalStartupId)]);
    return apiSuccess(res, activity, 201);
  }),
);

export default activityRouter;

