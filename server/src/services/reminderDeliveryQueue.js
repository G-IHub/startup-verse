import ReminderJob from "../models/ReminderJob.js";
import Notification from "../models/Notification.js";
import { logger } from "../config/logger.js";
import { emitRealtime } from "./realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { userRoom } from "../realtime/rooms.js";

const CRITICAL_NOTIFICATION_TYPES = new Set([
  "weekly-outcome-reminder",
  "weekly-review-reminder",
  "streak-at-risk",
  "task-assigned",
  "task-blocked",
]);

function backoffMs(attemptZeroBased) {
  return Math.min(120_000, 1500 * 2 ** attemptZeroBased);
}

export async function enqueueNotificationEmitRetry(notificationId, notificationType) {
  if (!CRITICAL_NOTIFICATION_TYPES.has(String(notificationType || ""))) {
    return null;
  }
  return ReminderJob.create({
    type: "notification_emit",
    status: "pending",
    attempts: 0,
    maxAttempts: 8,
    nextRunAt: new Date(),
    payload: { notificationId: String(notificationId) },
  });
}

export async function processReminderJobsOnce(limit = 25) {
  let processed = 0;
  for (let i = 0; i < limit; i += 1) {
    const job = await ReminderJob.findOneAndUpdate(
      { status: "pending", nextRunAt: { $lte: new Date() } },
      { $set: { status: "processing" } },
      { sort: { nextRunAt: 1 }, new: true },
    );
    if (!job) break;
    processed += 1;

    try {
      if (job.type !== "notification_emit") {
        await ReminderJob.findByIdAndUpdate(job._id, {
          status: "dead",
          lastError: "unknown_job_type",
          processedAt: new Date(),
        });
        continue;
      }

      const notification = await Notification.findById(job.payload?.notificationId);
      if (!notification) {
        await ReminderJob.findByIdAndUpdate(job._id, {
          status: "completed",
          lastError: "notification_missing",
          processedAt: new Date(),
        });
        continue;
      }

      const ok = emitRealtime(SOCKET_EVENTS.NOTIFICATION_CREATED, notification, [
        userRoom(notification.userId),
      ]);

      if (ok) {
        await ReminderJob.findByIdAndUpdate(job._id, {
          status: "completed",
          lastError: "",
          processedAt: new Date(),
        });
        logger.info("ReminderJob completed", { jobId: String(job._id), type: job.type });
      } else {
        const attempts = job.attempts + 1;
        const dead = attempts >= job.maxAttempts;
        await ReminderJob.findByIdAndUpdate(job._id, {
          status: dead ? "dead" : "pending",
          attempts,
          nextRunAt: dead ? job.nextRunAt : new Date(Date.now() + backoffMs(attempts - 1)),
          lastError: "socket_io_unavailable",
        });
        logger.warn("ReminderJob emit deferred", {
          jobId: String(job._id),
          attempts,
          dead,
        });
      }
    } catch (err) {
      const attempts = job.attempts + 1;
      const dead = attempts >= job.maxAttempts;
      const msg = err instanceof Error ? err.message : String(err);
      await ReminderJob.findByIdAndUpdate(job._id, {
        status: dead ? "dead" : "pending",
        attempts,
        nextRunAt: dead ? job.nextRunAt : new Date(Date.now() + backoffMs(attempts - 1)),
        lastError: msg.slice(0, 500),
      });
      logger.error("ReminderJob processing error", {
        jobId: String(job._id),
        error: msg,
        dead,
      });
    }
  }
  return processed;
}

export async function getReminderDeliveryMetrics() {
  const [pending, processing, completed, dead] = await Promise.all([
    ReminderJob.countDocuments({ status: "pending" }),
    ReminderJob.countDocuments({ status: "processing" }),
    ReminderJob.countDocuments({ status: "completed" }),
    ReminderJob.countDocuments({ status: "dead" }),
  ]);
  const oldest = await ReminderJob.findOne({ status: "pending" }).sort({ nextRunAt: 1 }).select("nextRunAt type").lean();
  return {
    pending,
    processing,
    completed,
    dead,
    oldestPendingNextRunAt: oldest?.nextRunAt || null,
    oldestPendingType: oldest?.type || null,
  };
}
