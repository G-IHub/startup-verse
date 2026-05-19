/**
 * HTTP rate limiting (Step 6.1 / X1).
 * IP-based limits; disable with RATE_LIMIT_DISABLED=true.
 */
import rateLimit from "express-rate-limit";
import { error as apiError } from "../utils/apiResponse.js";

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

function isRateLimitDisabled() {
  return String(process.env.RATE_LIMIT_DISABLED || "")
    .trim()
    .toLowerCase() === "true";
}

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function rateLimitHandler(req, res, _next, options) {
  const message =
    options?.message || "Too many requests. Please try again later.";
  return apiError(res, message, 429, [], "RATE_LIMITED");
}

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isRateLimitDisabled(),
    handler: (req, res, next, options) =>
      rateLimitHandler(req, res, next, { message, ...options }),
  });
}

/** Paths that use a dedicated stricter limiter (skip default bucket). */
export function shouldSkipApiDefaultLimiter(req) {
  if (isRateLimitDisabled()) return true;
  const path = (req.originalUrl || req.url || "").split("?")[0];
  if (/^\/api\/v1\/auth\/(signin|signup)\/?$/.test(path)) return true;
  if (path === "/api/v1/uploads" || path.startsWith("/api/v1/uploads/"))
    return true;
  if (
    path === "/api/v1/messages/bulk-send" ||
    path.startsWith("/api/v1/messages/bulk-send/")
  ) {
    return true;
  }
  return false;
}

export const authBurstLimiter = createLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_AUTH_WINDOW_MS,
    FIFTEEN_MIN_MS,
  ),
  max: parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 10),
  message: "Too many authentication attempts. Please try again later.",
});

export const uploadLimiter = createLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_UPLOAD_WINDOW_MS,
    FIFTEEN_MIN_MS,
  ),
  max: parsePositiveInt(process.env.RATE_LIMIT_UPLOAD_MAX, 30),
  message: "Too many upload requests. Please try again later.",
});

export const bulkSendLimiter = createLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_BULK_SEND_WINDOW_MS,
    FIFTEEN_MIN_MS,
  ),
  max: parsePositiveInt(process.env.RATE_LIMIT_BULK_SEND_MAX, 20),
  message: "Too many bulk message requests. Please try again later.",
});

export const apiDefaultLimiter = rateLimit({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_API_WINDOW_MS,
    FIFTEEN_MIN_MS,
  ),
  max: parsePositiveInt(process.env.RATE_LIMIT_API_MAX, 500),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldSkipApiDefaultLimiter(req),
  handler: (req, res, next, options) =>
    rateLimitHandler(req, res, next, options),
});
