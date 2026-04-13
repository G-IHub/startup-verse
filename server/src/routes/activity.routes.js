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

activityRouter.get(
  "/startups/:startupId/activities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startupId = String(req.params.startupId || "");
    if (!(await canAccessStartup(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }

    const limit = Math.min(200, Math.max(1, Number(req.query?.limit || 50)));
    const rows = await Activity.find({ startupId }).sort({ createdAt: -1, _id: -1 }).limit(limit);
    return apiSuccess(res, rows.map((row) => mapActivityToDto(row)));
  }),
);

activityRouter.post(
  "/startups/:startupId/activities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startupId = String(req.params.startupId || "");
    if (!(await canAccessStartup(req, startupId))) {
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
    const metadata =
      req.body?.metadata && typeof req.body.metadata === "object"
        ? req.body.metadata
        : {};
    const doc = await Activity.create({
      startupId,
      userId: String(userId),
      type,
      text: message,
      metadata: {
        ...metadata,
        userName: String(req.body?.userName || metadata.userName || ""),
        icon: String(req.body?.icon || metadata.icon || "📋"),
      },
    });
    const activity = mapActivityToDto(doc);
    emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activity, [startupRoom(startupId)]);
    return apiSuccess(res, activity, 201);
  }),
);

export default activityRouter;

