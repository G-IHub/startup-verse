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
import { mapMessageDto } from "../utils/messageDto.js";
import {
  normalizeAttachments,
  messageHasContent,
} from "../utils/messageAttachments.js";
import {
  buildForwardedFromSnapshot,
  canDeleteForEveryone,
  conversationVisibilityFilter,
  emitMessageUpdated,
  getMessageRealtimeRooms,
  isMessageParticipant,
  loadMessageById,
  resolveReplyPreview,
} from "../utils/messageActions.js";

const messagesRouter = Router();
const isSelfOrAdmin = (req, userId) => req.user?.isAdmin === true || String(req.user?.id) === String(userId);

function dtoForViewer(message, viewerId, extra = {}) {
  return mapMessageDto(message, { viewerUserId: viewerId, ...extra });
}

async function canAccessStartupMessages(req, startupId) {
  if (req.user?.isAdmin) return true;
  const normalizedStartupId = String(startupId || "");
  if (!normalizedStartupId) return true;
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

  const rooms = getMessageRealtimeRooms(message);
  emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, mapMessageDto(message), rooms);

  return message;
}

messagesRouter.post(
  "/messages/send",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      startupId = null,
      toUserId,
      body = "",
      attachments: rawAttachments = [],
      metadata = {},
      replyToMessageId = null,
      forwardedFrom: rawForwardedFrom = null,
    } = req.body || {};
    const attachments = normalizeAttachments(rawAttachments);

    if (!toUserId) {
      return apiError(res, "toUserId is required.", 400);
    }
    if (!messageHasContent(body, attachments) && !rawForwardedFrom) {
      return apiError(res, "Message body or at least one attachment is required.", 400);
    }

    if (startupId && !(await canAccessStartupMessages(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }

    let replyPreview = null;
    let replyToId = null;
    if (replyToMessageId) {
      replyPreview = await resolveReplyPreview(replyToMessageId, req.user.id);
      if (!replyPreview) {
        return apiError(res, "Invalid reply target.", 400);
      }
      replyToId = replyPreview.messageId;
    }

    let forwardedFrom = null;
    if (rawForwardedFrom && typeof rawForwardedFrom === "object") {
      forwardedFrom = {
        messageId: rawForwardedFrom.messageId || null,
        fromUserId: rawForwardedFrom.fromUserId || req.user.id,
        fromUserName: String(rawForwardedFrom.fromUserName || ""),
        bodySnippet: String(rawForwardedFrom.bodySnippet || ""),
        attachments: normalizeAttachments(rawForwardedFrom.attachments || []),
      };
    }

    const message = await createMessage({
      startupId,
      fromUserId: req.user.id,
      toUserId,
      body: String(body || "").trim(),
      attachments,
      metadata,
      replyToMessageId: replyToId,
      replyPreview,
      forwardedFrom,
      messageType: "dm",
    });

    return apiSuccess(res, dtoForViewer(message, req.user.id), 201);
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
    if (!req.body?.toUserId) {
      return apiError(res, "Missing toUserId", 400);
    }
    const rawBody =
      req.body?.body ?? req.body?.content ?? req.body?.message ?? "";
    const bodyText = String(rawBody || "").trim();
    if (!bodyText && !(Array.isArray(req.body?.attachments) && req.body.attachments.length > 0)) {
      return apiError(res, "Message body required", 400);
    }
    if (req.body?.startupId && !(await canAccessStartupMessages(req, req.body.startupId))) {
      return apiError(res, "Forbidden.", 403);
    }
    const message = await createMessage({
      startupId: req.body?.startupId || null,
      organizationId: req.body?.organizationId || null,
      fromUserId: req.user.id,
      toUserId: req.body?.toUserId,
      body: bodyText,
      attachments: normalizeAttachments(req.body?.attachments || []),
      messageType: "dm",
    });

    return apiSuccess(res, dtoForViewer(message, req.user.id), 201);
  }),
);

messagesRouter.delete(
  "/messages/:messageId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = String(req.query?.scope || "forMe");
    const message = await loadMessageById(req.params.messageId);
    if (!message) {
      return apiError(res, "Message not found.", 404);
    }
    if (!isMessageParticipant(message, req.user.id)) {
      return apiError(res, "Forbidden.", 403);
    }

    if (scope === "forEveryone") {
      if (!canDeleteForEveryone(message, req.user.id)) {
        return apiError(
          res,
          "You can only delete your own messages within 48 hours.",
          403,
        );
      }
      message.body = "";
      message.attachments = [];
      message.deletedForEveryoneAt = new Date();
      message.deletedForEveryoneBy = req.user.id;
      await message.save();
      emitMessageUpdated(message);
      return apiSuccess(res, dtoForViewer(message, req.user.id));
    }

    const userOid = req.user.id;
    if (!message.hiddenForUserIds.some((id) => String(id) === String(userOid))) {
      message.hiddenForUserIds.push(userOid);
      await message.save();
    }
    emitMessageUpdated(message);
    return apiSuccess(res, { deletedForMe: true, messageId: String(message._id) });
  }),
);

messagesRouter.post(
  "/messages/:messageId/forward",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { toUserId, startupId = null, caption = "" } = req.body || {};
    if (!toUserId) {
      return apiError(res, "toUserId is required.", 400);
    }

    const source = await loadMessageById(req.params.messageId);
    if (!source) {
      return apiError(res, "Message not found.", 404);
    }
    if (!isMessageParticipant(source, req.user.id)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (source.messageType !== "dm") {
      return apiError(res, "Only direct messages can be forwarded.", 400);
    }
    if (startupId && !(await canAccessStartupMessages(req, startupId))) {
      return apiError(res, "Forbidden.", 403);
    }

    let fromUserName = "";
    try {
      const sender = await User.findById(source.fromUserId, { name: 1 });
      fromUserName = sender?.name || "";
    } catch {
      /* optional */
    }

    const forwardedFrom = buildForwardedFromSnapshot(source, fromUserName);
    const bodyText = String(caption || "").trim();

    const message = await createMessage({
      startupId,
      fromUserId: req.user.id,
      toUserId,
      body: bodyText,
      attachments: [],
      forwardedFrom,
      messageType: "dm",
    });

    return apiSuccess(res, dtoForViewer(message, req.user.id), 201);
  }),
);

messagesRouter.get(
  "/messages/direct/:userId/:otherUserId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, otherUserId } = req.params;
    if (!isSelfOrAdmin(req, userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const messages = await Message.find({
      $or: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
      ...conversationVisibilityFilter(req.user.id),
    }).sort({ createdAt: 1 });
    return apiSuccess(
      res,
      messages.map((m) => dtoForViewer(m, req.user.id)).filter(Boolean),
    );
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
      ...conversationVisibilityFilter(req.user.id),
    }).sort({ createdAt: -1 });

    return apiSuccess(
      res,
      messages.map((m) => dtoForViewer(m, req.user.id)).filter(Boolean),
    );
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
      ...conversationVisibilityFilter(req.user.id),
    }).sort({ createdAt: 1 });

    return apiSuccess(
      res,
      messages.map((m) => dtoForViewer(m, req.user.id)).filter(Boolean),
    );
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

    const rows = await Message.find({
      startupId,
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      ...conversationVisibilityFilter(req.user.id),
    })
      .sort({ createdAt: -1 })
      .limit(500);

    const map = new Map();
    rows.forEach((row) => {
      const otherUserId = String(row.fromUserId) === String(userId) ? String(row.toUserId) : String(row.fromUserId);
      if (!map.has(otherUserId)) {
        map.set(otherUserId, row);
      }
    });

    return apiSuccess(
      res,
      Array.from(map.values())
        .map((m) => dtoForViewer(m, req.user.id))
        .filter(Boolean),
    );
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
      ...conversationVisibilityFilter(req.user.id),
    });

    return apiSuccess(res, { unreadCount: count, count });
  }),
);

messagesRouter.get(
  "/messages/organization/:organizationId",
  requireAuth,
  asyncHandler(organizationMessagesController.listOrganizationMessages),
);

export default messagesRouter;
