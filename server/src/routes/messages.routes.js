import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import * as organizationMessagesController from "../controllers/organizationMessages.controller.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Message from "../models/Message.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom, organizationRoom } from "../realtime/rooms.js";

const messagesRouter = Router();

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

  emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, message, rooms);

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

    const message = await createMessage({
      startupId,
      fromUserId: req.user.id,
      toUserId,
      body,
      attachments,
    });

    return apiSuccess(res, message, 201);
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
    const message = await createMessage({
      startupId: req.body?.startupId || null,
      organizationId: req.body?.organizationId || null,
      fromUserId: req.user.id,
      toUserId: req.body?.toUserId,
      body: req.body?.body || req.body?.message || "",
      attachments: req.body?.attachments || [],
    });

    return apiSuccess(res, message, 201);
  }),
);

messagesRouter.get(
  "/messages/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const messages = await Message.find({
      $or: [{ fromUserId: req.params.userId }, { toUserId: req.params.userId }],
    }).sort({ createdAt: -1 });

    return apiSuccess(res, messages);
  }),
);

messagesRouter.get(
  "/messages/conversation/:startupId/:userId/:otherUserId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startupId, userId, otherUserId } = req.params;
    const messages = await Message.find({
      startupId,
      $or: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    }).sort({ createdAt: 1 });

    return apiSuccess(res, messages);
  }),
);

messagesRouter.get(
  "/messages/conversations/:startupId/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startupId, userId } = req.params;

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

    return apiSuccess(res, Array.from(map.values()));
  }),
);

messagesRouter.post(
  "/messages/mark-read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { messageIds = [] } = req.body || {};

    await Message.updateMany(
      { _id: { $in: messageIds }, toUserId: req.user.id, readAt: null },
      { $set: { readAt: new Date() } },
    );

    return apiSuccess(res, { markedRead: true, count: messageIds.length });
  }),
);

messagesRouter.get(
  "/messages/unread-count/:startupId/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const count = await Message.countDocuments({
      startupId: req.params.startupId,
      toUserId: req.params.userId,
      readAt: null,
    });

    return apiSuccess(res, { unreadCount: count });
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