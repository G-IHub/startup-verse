import { env } from "./env.js";
import { logger } from "./logger.js";

function normalizeOrigin(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

const isWildcardCors =
  env.corsOrigins.length === 1 && env.corsOrigins[0] === "*";

const allowedOrigins = isWildcardCors
  ? []
  : env.corsOrigins.map(normalizeOrigin).filter(Boolean);

logger.info("CORS allowlist initialized.", {
  wildcard: isWildcardCors,
  origins: isWildcardCors ? "*" : allowedOrigins,
});

function originHandler(requestOrigin, callback) {
  // Same-origin or non-browser requests (curl, server-to-server) have no Origin header.
  if (!requestOrigin) return callback(null, true);

  if (isWildcardCors) return callback(null, true);

  const normalized = normalizeOrigin(requestOrigin);
  if (allowedOrigins.includes(normalized)) {
    return callback(null, true);
  }

  logger.warn("CORS denied origin.", {
    origin: requestOrigin,
    normalized,
    allowed: allowedOrigins,
  });
  return callback(null, false);
}

export const corsOptions = Object.freeze({
  origin: isWildcardCors ? "*" : originHandler,
  credentials: !isWildcardCors,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-Id",
  ],
  exposedHeaders: ["X-Request-Id"],
  maxAge: 600,
});
