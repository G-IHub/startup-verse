import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import * as organizationMessagesController from "../controllers/organizationMessages.controller.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom, organizationRoom } from "../realtime/rooms.js";
import { mapMessageDto } from "../utils/messageDto.js";
import {
  normalizeAttachments,
  messageHasContent,
} from "../utils/messageAttachments.js";
import { createNotification } from "../services/notificationService.js";
import { chatDeepLink } from "../utils/deepLinks.js";
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

async function resolveCanonicalStartupId(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return null;
  const byId = await Startup.findById(value, { _id: 1, founderId: 1 });
  if (byId?._id) {
    return { startupId: String(byId._id), founderId: String(byId.founderId || "") };
  }
  const byFounder = await Startup.findOne({ founderId: value }, { _id: 1, founderId: 1 });
  if (byFounder?._id) {
    return { startupId: String(byFounder._id), founderId: String(byFounder.founderId || value) };
  }
  return null;
}

async function canAccessStartup(req, startupId) {
  const resolved = await resolveCanonicalStartupId(startupId);
  if (!resolved) return null;
  if (req.user?.isAdmin) return resolved;

  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return null;

  const candidateIds = [req.user.id, me.startupId, me.founderId];
  for (const candidateId of candidateIds) {
    const candidate = await resolveCanonicalStartupId(candidateId);
    if (candidate && candidate.startupId === resolved.startupId) {
      return resolved;
    }
  }
  return null;
}

async function sanitizeMentionMetadata(metadata, startupScope) {
  if (!metadata || typeof metadata !== "object") return {};
  const mentions = Array.isArray(metadata.mentions) ? metadata.mentions : [];
  if (mentions.length === 0) return metadata;

  if (!startupScope?.founderId) {
    return { ...metadata, mentions: [] };
  }

  const founderId = startupScope.founderId;
  const milestoneIds = new Set();
  const taskIds = new Set();
  for (const mention of mentions) {
    if (!mention || typeof mention !== "object") continue;
    const type = String(mention.type || "");
    const id = String(mention.id || "");
    if (!id) continue;
    if (type === "milestone") milestoneIds.add(id);
    else if (type === "task") taskIds.add(id);
  }

  const [validMilestones, validTasks] = await Promise.all([
    milestoneIds.size
      ? Milestone.find(
          { _id: { $in: Array.from(milestoneIds) }, founderId },
          { _id: 1 },
        ).lean()
      : [],
    taskIds.size
      ? Task.find({ _id: { $in: Array.from(taskIds) }, founderId }, { _id: 1 }).lean()
      : [],
  ]);

  const validMilestoneSet = new Set(validMilestones.map((row) => String(row._id)));
  const validTaskSet = new Set(validTasks.map((row) => String(row._id)));

  const sanitizedMentions = mentions
    .filter((mention) => {
      if (!mention || typeof mention !== "object") return false;
      const type = String(mention.type || "");
      const id = String(mention.id || "");
      if (!id || !mention.label) return false;
      if (type === "milestone") return validMilestoneSet.has(id);
      if (type === "task") return validTaskSet.has(id);
      return false;
    })
    .map((mention) => ({
      type: String(mention.type),
      id: String(mention.id),
      label: String(mention.label || ""),
      snapshot:
        mention.snapshot && typeof mention.snapshot === "object" ? mention.snapshot : {},
    }));

  return { ...metadata, mentions: sanitizedMentions };
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

    const startupScope = startupId ? await resolveCanonicalStartupId(startupId) : null;
    const sanitizedMetadata = await sanitizeMentionMetadata(metadata, startupScope);

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
      metadata: sanitizedMetadata,
      replyToMessageId: replyToId,
      replyPreview,
      forwardedFrom,
      messageType: "dm",
    });

    const sender = await User.findById(req.user.id, { name: 1 }).lean();
    await createNotification({
      userId: toUserId,
      type: "message-received",
      title: "New message",
      message: `${sender?.name || "Someone"} sent you a message.`,
      actionUrl: chatDeepLink(req.user.id),
      metadata: {
        senderId: String(req.user.id),
        messageId: String(message._id),
      },
    }).catch(() => null);

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
  "/startups/:startupId/chat-mentionables",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startupScope = await canAccessStartup(req, req.params.startupId);
    if (!startupScope?.founderId) {
      return apiError(res, "Forbidden.", 403);
    }

    const founderId = startupScope.founderId;
    const [milestones, tasks] = await Promise.all([
      Milestone.find({ founderId }).sort({ sequence: 1 }).lean(),
      Task.find({ founderId }).sort({ createdAt: -1 }).lean(),
    ]);

    const milestoneTitleById = new Map(
      milestones.map((row) => [String(row._id), String(row.title || "Milestone")]),
    );

    const countsByMilestone = new Map();
    for (const task of tasks) {
      const key = String(task.milestoneId || "");
      const prev = countsByMilestone.get(key) || { totalTasks: 0, tasksCompleted: 0 };
      prev.totalTasks += 1;
      if (task.status === "completed") prev.tasksCompleted += 1;
      countsByMilestone.set(key, prev);
    }

    const milestoneRows = milestones.map((row) => {
      const counters = countsByMilestone.get(String(row._id)) || {
        totalTasks: 0,
        tasksCompleted: 0,
      };
      return {
        id: String(row._id),
        title: String(row.title || "Milestone"),
        status: String(row.status || "pending"),
        totalTasks: counters.totalTasks,
        tasksCompleted: counters.tasksCompleted,
      };
    });

    const taskRows = tasks.map((row) => {
      const milestoneId = row.milestoneId ? String(row.milestoneId) : "";
      return {
        id: String(row._id),
        title: String(row.title || "Untitled task"),
        status: String(row.status || "pending"),
        priority: String(row.priority || "medium"),
        assignedTo: row.assignedTo ? String(row.assignedTo) : "",
        assignedToName: String(row.assignedToName || ""),
        milestoneId,
        milestoneName: milestoneId ? milestoneTitleById.get(milestoneId) || "" : "",
      };
    });

    return apiSuccess(res, { milestones: milestoneRows, tasks: taskRows });
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
