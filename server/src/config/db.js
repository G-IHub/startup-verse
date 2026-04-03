import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongodbConnectionUri, {
      dbName: env.mongodbDbName || undefined,
    });
    logger.info("Database connected successfully.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    logger.error("Database connection failed.", { error: message });
    throw error;
  }
}

