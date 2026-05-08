import http from "http";
import cron from "node-cron";
import app from "./app.js";
import { corsOptions } from "./config/cors.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initSocketServer } from "./realtime/socketServer.js";
import { processReminderJobsOnce } from "./services/reminderDeliveryQueue.js";
import {
  runWeeklyOutcomeReminderJob,
  runWeeklyReviewReminderJob,
  runStreakAtRiskJob,
  runDeliverableDueSoonJob,
  runEventReminderJob,
  runCohortInvitationExpiryJob,
} from "./services/schedulerJobs.js";

async function startServer() {
  try {
    await connectDatabase();

    const workerMs = Number(process.env.REMINDER_JOB_POLL_MS || 10_000);
    const reminderTimer = setInterval(() => {
      processReminderJobsOnce().catch((err) => {
        logger.error("Reminder job worker tick failed.", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, workerMs);
    if (typeof reminderTimer.unref === "function") {
      reminderTimer.unref();
    }

    const cronDisabled = String(process.env.DISABLE_SERVER_CRON || "").toLowerCase() === "true";
    if (!cronDisabled) {
      const tz = process.env.SCHEDULER_TZ || undefined;
      const opts = tz ? { timezone: tz } : {};
      const safe = (name, fn) => () => {
        fn().catch((err) =>
          logger.error(`Cron job failed: ${name}`, {
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      };
      cron.schedule("0 18 * * 0", safe("weekly-outcome-reminder", runWeeklyOutcomeReminderJob), opts);
      cron.schedule("0 16 * * 5", safe("weekly-review-reminder", runWeeklyReviewReminderJob), opts);
      cron.schedule("0 9 * * 6", safe("streak-at-risk", runStreakAtRiskJob), opts);
      cron.schedule(
        "0 9 * * *",
        safe("daily-deliverables-invitations", async () => {
          await runDeliverableDueSoonJob();
          await runCohortInvitationExpiryJob();
        }),
        opts,
      );
      cron.schedule("*/30 * * * *", safe("event-reminder", runEventReminderJob), opts);
      logger.info("Server cron scheduler started.", { timezone: tz || "system local" });
    } else {
      logger.info("Server cron scheduler disabled (DISABLE_SERVER_CRON=true).");
    }

    const httpServer = http.createServer(app);
    initSocketServer(httpServer, corsOptions);

    httpServer.listen(env.port, () => {
      logger.info("Server running.", {
        port: env.port,
        nodeEnv: env.nodeEnv,
      });
    });
  } catch (error) {
    logger.error("Failed to start server.", {
      error: error instanceof Error ? error.message : "Unknown startup error",
    });
    process.exit(1);
  }
}

startServer();