/**
 * Sentry error monitoring (Step 7.2 / X3). Active only when SENTRY_DSN is set.
 */
import * as Sentry from "@sentry/node";

const dsn = String(process.env.SENTRY_DSN || "").trim();

export const sentryEnabled = dsn.length > 0;

const SENSITIVE_HEADER_KEYS = new Set([
  "cookie",
  "authorization",
  "set-cookie",
]);

const SENSITIVE_BODY_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "accesstoken",
  "refreshtoken",
  "jwt",
  "secret",
]);

function scrubRequestHeaders(headers) {
  if (!headers || typeof headers !== "object") return;
  for (const key of Object.keys(headers)) {
    if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase())) {
      delete headers[key];
    }
  }
}

function scrubDataObject(data) {
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data)) {
    for (const item of data) scrubDataObject(item);
    return;
  }
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_BODY_KEYS.has(key.toLowerCase())) {
      data[key] = "[Filtered]";
    } else if (value && typeof value === "object") {
      scrubDataObject(value);
    }
  }
}

function scrubSentryEvent(event) {
  if (event.request?.headers) {
    scrubRequestHeaders(event.request.headers);
  }
  if (event.request?.data) {
    scrubDataObject(event.request.data);
  }
  return event;
}

let initialized = false;

export function initSentry() {
  if (!sentryEnabled || initialized) return;
  const environment =
    String(process.env.SENTRY_ENVIRONMENT || "").trim() ||
    process.env.NODE_ENV ||
    "development";

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 0,
    beforeSend: scrubSentryEvent,
  });
  initialized = true;
}

export function captureSentryException(error) {
  if (!sentryEnabled) return;
  Sentry.captureException(error);
}

export { Sentry };

initSentry();
