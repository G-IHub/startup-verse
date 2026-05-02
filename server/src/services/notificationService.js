import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitRealtime } from "./realtime.service.js";
import { enqueueNotificationEmitRetry } from "./reminderDeliveryQueue.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { userRoom } from "../realtime/rooms.js";
import { logger } from "../config/logger.js";

/**
 * Centralized notification creation. Honors `User.notificationPreferences`,
 * persists a `Notification` document, emits Socket.IO `notification:created`
 * to the user room, and enqueues a retry job for critical types when emit
 * fails.
 *
 * Use this from domain controllers (founders, deliverables, mentors, etc.)
 * instead of writing to the `Notification` model directly.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.userId - recipient
 * @param {string} options.type - notification type (e.g. "task-assigned")
 * @param {string} [options.title] - short title
 * @param {string} options.message - full message body
 * @param {string} [options.actionUrl] - canonical deep link
 * @param {Object} [options.metadata] - extra payload (entity ids, etc.)
 * @param {boolean} [options.skipPreferences=false] - bypass user preferences (admin/system)
 * @returns {Promise<Object|null>} the created notification or null when suppressed
 */
export async function createNotification({
  userId,
  type,
  title = "Notification",
  message,
  actionUrl = "",
  metadata = {},
  skipPreferences = false,
} = {}) {
  if (!userId) {
    logger.warn("notificationService.createNotification called without userId");
    return null;
  }
  if (!message) {
    logger.warn("notificationService.createNotification called without message", { type });
    return null;
  }

  if (!skipPreferences) {
    try {
      const user = await User.findById(userId).select("notificationPreferences").lean();
      const prefs = user?.notificationPreferences || {};
      // Convention: prefs[type] === false silences that type. prefs.all === false
      // silences everything. Missing keys default to "enabled".
      if (prefs?.all === false) return null;
      if (prefs && type && prefs[type] === false) return null;
    } catch (err) {
      // Preference lookup must never block delivery on errors.
      logger.warn("notificationService preference lookup failed", { error: err.message });
    }
  }

  const notification = await Notification.create({
    userId,
    title,
    message,
    type: type || "general",
    actionUrl: String(actionUrl || ""),
    metadata: metadata || {},
  });

  try {
    const delivered = emitRealtime(SOCKET_EVENTS.NOTIFICATION_CREATED, notification, [
      userRoom(notification.userId),
    ]);
    if (!delivered) {
      await enqueueNotificationEmitRetry(notification._id, notification.type);
    }
  } catch (err) {
    await enqueueNotificationEmitRetry(notification._id, notification.type);
    logger.warn("notificationService emit failed; queued for retry", { error: err.message });
  }

  return notification;
}

/**
 * Create the same notification for many users in parallel (best-effort).
 * Used for cohort/team broadcasts.
 */
export async function broadcastNotification(userIds, payload) {
  const ids = Array.isArray(userIds) ? userIds.filter(Boolean) : [];
  if (!ids.length) return [];
  const results = await Promise.all(
    ids.map((userId) =>
      createNotification({ ...payload, userId }).catch((err) => {
        logger.warn("notificationService.broadcastNotification error", {
          userId: String(userId),
          error: err.message,
        });
        return null;
      }),
    ),
  );
  return results.filter(Boolean);
}

export default { createNotification, broadcastNotification };
