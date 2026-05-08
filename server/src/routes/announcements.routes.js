import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as announcementsController from "../controllers/announcements.controller.js";
import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { announcementRoom } from "../realtime/rooms.js";

const announcementsRouter = Router();

const isSelfOrAdmin = (req, userId) =>
  req.user?.isAdmin === true || req.user?.id === String(userId);

async function resolveStartupScope(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return null;
  const byId = await Startup.findById(value, { _id: 1, founderId: 1 });
  if (byId?._id) {
    return {
      canonicalId: String(byId._id),
      founderUserId: byId.founderId ? String(byId.founderId) : null,
    };
  }
  const byFounder = await Startup.findOne({ founderId: value }, { _id: 1, founderId: 1 });
  if (byFounder?._id) {
    return {
      canonicalId: String(byFounder._id),
      founderUserId: byFounder.founderId ? String(byFounder.founderId) : null,
    };
  }
  return null;
}

/** @returns {Promise<{ canonicalId: string, founderUserId: string | null } | null>} */
async function canAccessStartupAnnouncements(req, startupId) {
  const requested = await resolveStartupScope(startupId);
  if (!requested) return null;
  if (req.user?.isAdmin) return requested;

  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return null;

  const candidates = [req.user.id, me.startupId, me.founderId].filter(Boolean);
  for (const candidateId of candidates) {
    const scope = await resolveStartupScope(candidateId);
    if (scope && scope.canonicalId === requested.canonicalId) {
      return requested;
    }
  }
  return null;
}

function announcementQueryKeys(scope) {
  const keys = [scope.canonicalId];
  if (scope.founderUserId && scope.founderUserId !== scope.canonicalId) {
    keys.push(scope.founderUserId);
  }
  return keys;
}

function mapAnnouncementDto(doc) {
  const row = doc?.toObject ? doc.toObject() : doc || {};
  return {
    id: String(row._id || row.id || ""),
    startupId: String(row.founderId || row.startupId || ""),
    title: String(row.title || "Announcement"),
    message: String(row.body || row.message || ""),
    body: String(row.body || ""),
    priority: String(row.priority || "normal"),
    category: String(row.category || "general"),
    emoji: String(row.emoji || ""),
    createdBy: String(row.createdBy || ""),
    createdByName: String(row.createdByName || ""),
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    readBy: Array.isArray(row.readBy) ? row.readBy.map(String) : [],
  };
}

announcementsRouter.get(
  "/startups/:startupId/announcements",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = await canAccessStartupAnnouncements(req, req.params.startupId);
    if (!scope) {
      return apiError(res, "Forbidden.", 403);
    }
    const keys = announcementQueryKeys(scope);
    const rows = await Announcement.find({ founderId: { $in: keys } }).sort({
      createdAt: -1,
      _id: -1,
    });
    return apiSuccess(res, rows.map(mapAnnouncementDto));
  }),
);

announcementsRouter.post(
  "/startups/:startupId/announcements",
  requireAuth,
  asyncHandler(async (req, res) => {
    const paramId = String(req.params.startupId || "");
    const scope = await canAccessStartupAnnouncements(req, paramId);
    if (!scope) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!isSelfOrAdmin(req, req.body?.userId || req.user.id)) {
      return apiError(res, "Forbidden.", 403);
    }
    const message = String(req.body?.message || req.body?.body || "").trim();
    if (!message) {
      return apiError(res, "message is required.", 400);
    }
    const createdBy = String(req.user.id);
    const createdByName = String(req.user?.name || req.user?.email || "");
    const announcement = await Announcement.create({
      founderId: scope.canonicalId,
      title: String(req.body?.title || "Announcement"),
      body: message,
      priority: String(req.body?.priority || "normal"),
      category: String(req.body?.category || "general"),
      emoji: String(req.body?.emoji || ""),
      createdBy,
      createdByName,
      readBy: [createdBy],
    });
    const dto = mapAnnouncementDto(announcement);
    emitRealtime(SOCKET_EVENTS.ANNOUNCEMENT_CREATED, dto, [announcementRoom(scope.canonicalId)]);
    return apiSuccess(res, dto, 201);
  }),
);

announcementsRouter.post(
  "/announcements/:announcementId/mark-read",
  requireAuth,
  asyncHandler(announcementsController.markAnnouncementRead),
);

export default announcementsRouter;
