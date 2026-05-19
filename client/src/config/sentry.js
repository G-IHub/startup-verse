/**
 * Sentry browser monitoring (Step 7.2). Active only when VITE_SENTRY_DSN is set.
 */
import * as Sentry from "@sentry/react";

const dsn = String(import.meta.env.VITE_SENTRY_DSN || "").trim();

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

if (sentryEnabled) {
  const environment =
    String(import.meta.env.VITE_SENTRY_ENVIRONMENT || "").trim() ||
    import.meta.env.MODE ||
    "development";

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 0,
    beforeSend: scrubSentryEvent,
  });
}

export { Sentry };
