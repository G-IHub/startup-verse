import crypto from "node:crypto";
import { logger } from "../config/logger.js";

export default function requestId(req, res, next) {
  const incomingRequestId = req.get("x-request-id");
  req.id =
    typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0
      ? incomingRequestId.trim()
      : crypto.randomUUID();

  res.setHeader("x-request-id", req.id);
  const start = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}

