import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Presence from "../models/Presence.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";
import { mapActivityToDto } from "../utils/activityDto.js";

const presenceRouter = Router();
const isSelfOrAdmin = (req, userId) => req.user?.isAdmin === true || req.user?.id === String(userId);
const NORMALIZED_ONLINE_STATUSES = new Set(["available", "in-meeting", "focus-mode", "on-break"]);

function normalizePresenceRow(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    startupId: String(doc.startupId || ""),
    userId: String(doc.userId || ""),
    userName: String(doc.userName || ""),
    role: String(doc.role || ""),
    isOnline: Boolean(doc.isOnline),
    statusText: String(doc.statusText || ""),
    mood: String(doc.mood || ""),
    lastSeenAt: doc.lastSeenAt || doc.updatedAt || new Date(),
    metadata: doc.metadata || {},
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

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

    const mergedMetadata =
      activity && typeof activity === "object"
        ? { ...metadata, lastFeedActivity: activity }
        : metadata;
    const normalizedOnline =
      typeof isOnline === "boolean"
        ? isOnline
        : NORMALIZED_ONLINE_STATUSES.has(String(status || "").toLowerCase());

    const presence = await Presence.findOneAndUpdate(
      { startupId: String(startupId), userId: String(userId) },
      {
        startupId: String(startupId),
        userId: String(userId),
        userName,
        role,
        isOnline: normalizedOnline,
        statusText: String(statusText || ""),
        mood: String(mood || ""),
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: mergedMetadata,
      },
      { upsert: true, new: true, runValidators: true },
    );
    const normalizedPresence = normalizePresenceRow(presence);

    emitRealtime(SOCKET_EVENTS.PRESENCE_UPDATED, normalizedPresence, [startupRoom(startupId)]);

    if (activity && typeof activity === "object" && startupId) {
      const { lastFeedActivity: _ignoredActivity, ...activityMetadata } =
        mergedMetadata && typeof mergedMetadata === "object" ? mergedMetadata : {};
      const activityDoc = await Activity.create({
        startupId: String(startupId),
        userId: String(userId),
        type: String(activity.type || "update"),
        text: String(activity.message || ""),
        metadata: {
          ...activityMetadata,
          userName: String(activity.userName || userName || ""),
          icon: String(activity.icon || "📋"),
        },
      });
      emitRealtime(
        SOCKET_EVENTS.ACTIVITY_CREATED,
        mapActivityToDto(activityDoc),
        [startupRoom(startupId)],
      );
    }

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
    const rows = await Presence.find({ startupId: req.params.startupId }).sort({ updatedAt: -1 });
    return apiSuccess(res, rows.map((row) => normalizePresenceRow(row)));
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