import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import Presence from "../models/Presence.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";

const presenceRouter = Router();

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
      metadata = {},
      activity,
    } = req.body || {};

    const mergedMetadata =
      activity && typeof activity === "object"
        ? { ...metadata, lastFeedActivity: activity }
        : metadata;

    const presence = await Presence.findOneAndUpdate(
      { startupId: String(startupId), userId: String(userId) },
      {
        startupId: String(startupId),
        userId: String(userId),
        userName,
        role,
        isOnline: Boolean(isOnline),
        lastSeenAt: new Date(),
        metadata: mergedMetadata,
      },
      { upsert: true, new: true, runValidators: true },
    );

    emitRealtime(SOCKET_EVENTS.PRESENCE_UPDATED, presence, [startupRoom(startupId)]);

    if (activity && typeof activity === "object" && startupId) {
      emitRealtime(
        SOCKET_EVENTS.ACTIVITY_CREATED,
        {
          id: `${String(userId)}-${Date.now()}`,
          userId: String(userId),
          userName: String(activity.userName || userName || ""),
          type: String(activity.type || "update"),
          message: String(activity.message || ""),
          icon: String(activity.icon || "📋"),
          timestamp: String(activity.timestamp || new Date().toISOString()),
          startupId: String(startupId),
        },
        [startupRoom(startupId)],
      );
    }

    return apiSuccess(res, presence, 201);
  }),
);

presenceRouter.get(
  "/presence/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await Presence.find({ startupId: req.params.startupId }).sort({ updatedAt: -1 });
    return apiSuccess(res, rows);
  }),
);

presenceRouter.delete(
  "/presence/:startupId/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
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