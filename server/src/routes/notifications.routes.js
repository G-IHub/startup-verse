import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Notification from "../models/Notification.js";
import { emitRealtime } from "../services/realtime.service.js";
import { enqueueNotificationEmitRetry } from "../services/reminderDeliveryQueue.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { userRoom } from "../realtime/rooms.js";

const notificationsRouter = Router();

async function createAndEmitNotification(payload) {
  const notification = await Notification.create(payload);
  try {
    const delivered = emitRealtime(SOCKET_EVENTS.NOTIFICATION_CREATED, notification, [
      userRoom(notification.userId),
    ]);
    if (!delivered) {
      await enqueueNotificationEmitRetry(notification._id, notification.type);
    }
  } catch {
    await enqueueNotificationEmitRetry(notification._id, notification.type);
  }
  return notification;
}

notificationsRouter.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = req.query?.userId || req.user.id;
    const notifications = await Notification.find({ userId: targetUserId }).sort({ createdAt: -1 }).limit(200);

    return apiSuccess(res, notifications);
  }),
);

notificationsRouter.post(
  "/notifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await createAndEmitNotification({
      userId: req.body?.userId,
      title: req.body?.title || "Notification",
      message: req.body?.message || "",
      type: req.body?.type || "general",
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

    const created = [];
    for (const item of items) {
      const notification = await createAndEmitNotification({
        userId: item.userId,
        title: item.title || "Notification",
        message: item.message || "",
        type: item.type || "general",
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
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { readAt: new Date() },
      { new: true },
    );

    if (!notification) {
      return apiError(res, "Notification not found.", 404);
    }

    return apiSuccess(res, notification);
  }),
);

notificationsRouter.delete(
  "/notifications/:notificationId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Notification.findByIdAndDelete(req.params.notificationId);
    return apiSuccess(res, { deleted: true });
  }),
);

notificationsRouter.post(
  "/notifications/test",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await createAndEmitNotification({
      userId: req.body?.userId || req.user.id,
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
    const notification = await createAndEmitNotification({
      userId: req.body?.userId,
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
    const notification = await createAndEmitNotification({
      userId: req.body?.userId,
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
    const notification = await createAndEmitNotification({
      userId: req.body?.userId,
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
    const notification = await createAndEmitNotification({
      userId: req.body?.userId,
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
    const notification = await createAndEmitNotification({
      userId: req.body?.userId,
      title: "Streak At Risk",
      message: req.body?.message || "Your execution streak is at risk.",
      type: "streak-at-risk",
      metadata: req.body?.metadata || {},
    });
    return apiSuccess(res, notification, 201);
  }),
);

notificationsRouter.post(
  "/users/:userId/notifications/mark-all-read",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ userId: req.params.userId, readAt: null }, { $set: { readAt: new Date() } });
    return apiSuccess(res, { markedAllRead: true });
  }),
);

export default notificationsRouter;