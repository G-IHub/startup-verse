import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import * as organizationMessagesController from "../controllers/organizationMessages.controller.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom, organizationRoom } from "../realtime/rooms.js";

const messagesRouter = Router();
const isSelfOrAdmin = (req, userId) => req.user?.isAdmin === true || String(req.user?.id) === String(userId);

function mapMessageDto(messageDoc) {
  if (!messageDoc) return null;
  const row = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
  return {
    id: String(row._id || row.id || ""),
    startupId: row.startupId ? String(row.startupId) : "",
    organizationId: row.organizationId ? String(row.organizationId) : "",
    fromUserId: row.fromUserId ? String(row.fromUserId) : "",
    toUserId: row.toUserId ? String(row.toUserId) : "",
    body: String(row.body || ""),
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    readAt: row.readAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

async function canAccessStartupMessages(req, startupId) {
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

async function createMessage(payload) {
  const message = await Message.create(payload);

  const rooms = [];
  if (message.startupId) {
    rooms.push(startupRoom(message.startupId));
  }
  if (message.organizationId) {
    rooms.push(organizationRoom(message.organizationId));
  }
  rooms.push(userRoom(message.toUserId));

  emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, mapMessageDto(message), rooms);

  return message;
}

messagesRouter.post(
  "/messages/send",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startupId = null, toUserId, body = "", attachments = [] } = req.body || {};

    if (!toUserId || !body) {
      return apiError(res, "toUserId and body are required.", 400);
    }

    if (startupId && !(await canAccessStartupMessages(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const message = await createMessage({
      startupId,
      fromUserId: req.user.id,
      toUserId,
      body,
      attachments,
    });

    return apiSuccess(res, mapMessageDto(message), 201);
  }),
);

messagesRouter.post(
  "/messages/bulk-send",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationMessagesController.bulkSendOrgMessages),
);
messagesRouter.post(
  "/messages/send-individual",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationMessagesController.sendIndividualOrgMessage),
);

messagesRouter.post(
  "/messages/send-from-founder",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.body?.startupId && !(await canAccessStartupMessages(req, req.body.startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const message = await createMessage({
      startupId: req.body?.startupId || null,
      organizationId: req.body?.organizationId || null,
      fromUserId: req.user.id,
      toUserId: req.body?.toUserId,
      body: req.body?.body || req.body?.content || req.body?.message || "",
      attachments: req.body?.attachments || [],
    });

    return apiSuccess(res, mapMessageDto(message), 201);
  }),
);

messagesRouter.get(
  "/messages/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isSelfOrAdmin(req, req.params.userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const messages = await Message.find({
      $or: [{ fromUserId: req.params.userId }, { toUserId: req.params.userId }],
    }).sort({ createdAt: -1 });

    return apiSuccess(res, messages.map(mapMessageDto));
  }),
);

messagesRouter.get(
  "/messages/conversation/:startupId/:userId/:otherUserId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startupId, userId, otherUserId } = req.params;
    if (!isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!(await canAccessStartupMessages(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const messages = await Message.find({
      startupId,
      $or: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    }).sort({ createdAt: 1 });

    return apiSuccess(res, messages.map(mapMessageDto));
  }),
);

messagesRouter.get(
  "/messages/conversations/:startupId/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startupId, userId } = req.params;
    if (!isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!(await canAccessStartupMessages(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }

    const rows = await Message.find({ startupId, $or: [{ fromUserId: userId }, { toUserId: userId }] })
      .sort({ createdAt: -1 })
      .limit(500);

    const map = new Map();
    rows.forEach((row) => {
      const otherUserId = String(row.fromUserId) === String(userId) ? String(row.toUserId) : String(row.fromUserId);
      if (!map.has(otherUserId)) {
        map.set(otherUserId, row);
      }
    });

    return apiSuccess(res, Array.from(map.values()).map(mapMessageDto));
  }),
);

messagesRouter.post(
  "/messages/mark-read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { messageIds = [], userId, otherUserId, startupId } = req.body || {};
    if (userId && !isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (startupId && !(await canAccessStartupMessages(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const targetUserId = userId || req.user.id;
    let query = { _id: { $in: messageIds }, toUserId: targetUserId, readAt: null };
    if ((!messageIds || messageIds.length === 0) && otherUserId && startupId) {
      query = {
        startupId,
        toUserId: targetUserId,
        fromUserId: otherUserId,
        readAt: null,
      };
    }
    const result = await Message.updateMany(query, { $set: { readAt: new Date() } });
    return apiSuccess(res, { markedRead: true, count: Number(result.modifiedCount || 0) });
  }),
);

messagesRouter.get(
  "/messages/unread-count/:startupId/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isSelfOrAdmin(req, req.params.userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!(await canAccessStartupMessages(req, req.params.startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const count = await Message.countDocuments({
      startupId: req.params.startupId,
      toUserId: req.params.userId,
      readAt: null,
    });

    return apiSuccess(res, { unreadCount: count, count });
  }),
);

messagesRouter.post(
  "/messages/upload-file",
  requireAuth,
  asyncHandler(async (req, res) => {
    const fileName = req.body?.fileName || "attachment.bin";
    return apiSuccess(res, {
      uploaded: true,
      fileName,
      fileUrl: `/uploads/${Date.now()}-${fileName}`,
    });
  }),
);

messagesRouter.get(
  "/messages/organization/:organizationId",
  requireAuth,
  asyncHandler(organizationMessagesController.listOrganizationMessages),
);

export default messagesRouter;