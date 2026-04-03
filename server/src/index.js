import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
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

