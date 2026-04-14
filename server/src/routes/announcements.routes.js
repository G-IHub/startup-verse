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
import { startupRoom } from "../realtime/rooms.js";

const announcementsRouter = Router();

const isSelfOrAdmin = (req, userId) =>
  req.user?.isAdmin === true || req.user?.id === String(userId);

async function canAccessStartupAnnouncements(req, startupId) {
  if (req.user?.isAdmin) return true;
  const normalizedStartupId = String(startupId || "");
  if (!normalizedStartupId) return false;
  if (normalizedStartupId === String(req.user.id)) return true;
  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return false;
  if (String(me.founderId || "") === normalizedStartupId) return true;
  if (String(me.startupId || "") === normalizedStartupId) return true;
  const founded = await Startup.findOne({ founderId: req.user.id }, { _id: 1 });
  return String(founded?._id || "") === normalizedStartupId;
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
    if (!(await canAccessStartupAnnouncements(req, req.params.startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const rows = await Announcement.find({ founderId: req.params.startupId }).sort({
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
    const startupId = String(req.params.startupId || "");
    if (!(await canAccessStartupAnnouncements(req, startupId))) {
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
      founderId: startupId,
      title: String(req.body?.title || "Announcement"),
      body: message,
      priority: String(req.body?.priority || "normal"),
      category: String(req.body?.category || "general"),
      createdBy,
      createdByName,
      readBy: [createdBy],
    });
    const dto = mapAnnouncementDto(announcement);
    emitRealtime(SOCKET_EVENTS.ANNOUNCEMENT_CREATED, dto, [startupRoom(startupId)]);
    return apiSuccess(res, dto, 201);
  }),
);

announcementsRouter.post(
  "/announcements/:announcementId/mark-read",
  requireAuth,
  asyncHandler(announcementsController.markAnnouncementRead),
);

export default announcementsRouter;
