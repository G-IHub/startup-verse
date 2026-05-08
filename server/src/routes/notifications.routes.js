import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../services/notificationService.js";

// Realtime fanout is implemented in notificationService.js using
// emitRealtime(SOCKET_EVENTS.NOTIFICATION_CREATED, ...) to user rooms.
// Failed emits enqueueNotificationEmitRetry(notificationId, type) for backoff delivery.

const notificationsRouter = Router();
const isSelfOrAdmin = (req, userId) => req.user?.isAdmin === true || req.user?.id === String(userId);

// Compatibility shim — preserves the historical `createAndEmitNotification`
// surface used by existing routes, but delegates to the canonical service.
async function createAndEmitNotification(payload) {
  return createNotification({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    actionUrl: payload.actionUrl || payload.metadata?.actionUrl || "",
    metadata: payload.metadata || {},
    // Manual triggers used by clients/admins should bypass user prefs so that
    // legitimate operational notifications (test, manual reminder) still arrive.
    skipPreferences: true,
  });
}

notificationsRouter.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.query?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notifications = await Notification.find({ userId: targetUserId }).sort({ createdAt: -1 }).limit(200);

    return apiSuccess(res, notifications);
  }),
);

notificationsRouter.post(
  "/notifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: req.body?.title || "Notification",
      message: req.body?.message || "",
      type: req.body?.type || "general",
      actionUrl: req.body?.actionUrl || "",
      metadata: req.body?.metadata || {},
    });

    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/notifications/batch",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body?.notifications) ? req.body.notifications : [];
    if (!req.user?.isAdmin) {
      const foreignItem = items.find((item) => String(item?.userId || req.user.id) !== req.user.id);
      if (foreignItem) {
        return apiError(res, "Forbidden.", 403);
      }
    }

    const created = [];
    for (const item of items) {
      const notification = await createAndEmitNotification({
        userId: item.userId,
        title: item.title || "Notification",
        message: item.message || "",
        type: item.type || "general",
        actionUrl: item.actionUrl || "",
        metadata: item.metadata || {},
      });
      created.push(notification);
    }

    return apiSuccess(res, created, 201);
  }),
);

notificationsRouter.put(
  "/notifications/:notificationId/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return apiError(res, "Notification not found.", 404);
    }
    if (!isSelfOrAdmin(req, notification.userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    notification.readAt = new Date();
    await notification.save();

    return apiSuccess(res, notification);
  }),
);

notificationsRouter.delete(
  "/notifications/:notificationId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      return apiError(res, "Notification not found.", 404);
    }
    if (!isSelfOrAdmin(req, notification.userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    await Notification.findByIdAndDelete(req.params.notificationId);
    return apiSuccess(res, { deleted: true });
  }),
);

notificationsRouter.post(
  "/notifications/test",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: "Test Notification",
      message: req.body?.message || "Test notification from StartupVerse API.",
      type: "test",
      metadata: { generatedAt: new Date().toISOString() },
    });

    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/notifications/weekly-outcome-reminder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: "Weekly Outcome Reminder",
      message: req.body?.message || "Reminder to update your weekly outcome.",
      type: "weekly-outcome-reminder",
      metadata: req.body?.metadata || {},
    });
    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/notifications/task-assigned",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: "Task Assigned",
      message: req.body?.message || "A new task has been assigned to you.",
      type: "task-assigned",
      metadata: req.body?.metadata || {},
    });
    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/notifications/task-blocked",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: "Task Blocked",
      message: req.body?.message || "A task is blocked and needs attention.",
      type: "task-blocked",
      metadata: req.body?.metadata || {},
    });
    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/notifications/weekly-review-reminder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: "Weekly Review Reminder",
      message: req.body?.message || "Reminder for weekly review.",
      type: "weekly-review-reminder",
      metadata: req.body?.metadata || {},
    });
    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/notifications/streak-at-risk",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.body?.userId || req.user.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const notification = await createAndEmitNotification({
      userId: targetUserId,
      title: "Streak At Risk",
      message: req.body?.message || "Your execution streak is at risk.",
      type: "streak-at-risk",
      metadata: req.body?.metadata || {},
    });
    return apiSuccess(res, notification, 201);
  }),
);

export default notificationsRouter;
