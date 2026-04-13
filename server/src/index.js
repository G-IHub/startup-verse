import http from "http";
import app from "./app.js";
import { corsOptions } from "./config/cors.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initSocketServer } from "./realtime/socketServer.js";
import { processReminderJobsOnce } from "./services/reminderDeliveryQueue.js";

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