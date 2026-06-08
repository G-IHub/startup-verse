import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import Presence from "../models/Presence.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";
import {
  listStartupPresence,
  upsertPresence,
} from "../services/presence.service.js";
const presenceRouter = Router();
const isSelfOrAdmin = (req, userId) =>
  req.user?.isAdmin === true || req.user?.id === String(userId);

async function canAccessStartupPresence(req, startupId) {
  if (req.user?.isAdmin) return true;
  const normalizedStartupId = String(startupId || "");
  if (normalizedStartupId === String(req.user.id)) return true;
  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return false;
  if (String(me.founderId || "") === normalizedStartupId) return true;
  if (String(me.startupId || "") === normalizedStartupId) return true;
  const founded = await Startup.findOne({ founderId: req.user.id }, { _id: 1 });
  return String(founded?._id || "") === normalizedStartupId;
}

presenceRouter.post(
  "/presence/update",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      startupId,
      userId = req.user.id,
      userName = "",
      role = req.user.role,
      isOnline = true,
      status = "available",
      statusText = "",
      mood = "",
      metadata = {},
      activity,
    } = req.body || {};
    if (!startupId) {
      return apiError(res, "startupId is required.", 400);
    }
    if (!isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!(await canAccessStartupPresence(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }

    const normalizedPresence = await upsertPresence({
      startupId,
      userId,
      userName,
      role,
      isOnline,
      status,
      statusText,
      mood,
      metadata,
      activity,
    });

    return apiSuccess(res, normalizedPresence, 201);
  }),
);

presenceRouter.get(
  "/presence/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!(await canAccessStartupPresence(req, req.params.startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const rows = await listStartupPresence(req.params.startupId);
    return apiSuccess(res, rows);
  }),
);

presenceRouter.delete(
  "/presence/:startupId/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isSelfOrAdmin(req, req.params.userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!(await canAccessStartupPresence(req, req.params.startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    await Presence.findOneAndDelete({
      startupId: req.params.startupId,
      userId: req.params.userId,
    });

    emitRealtime(
      SOCKET_EVENTS.PRESENCE_REMOVED,
      { startupId: req.params.startupId, userId: req.params.userId },
      [startupRoom(req.params.startupId)],
    );

    return apiSuccess(res, { removed: true });
  }),
);

export default presenceRouter;
