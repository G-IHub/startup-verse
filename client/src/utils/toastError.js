import { toast } from "sonner";

const LEGACY_API_ERROR_RE = /^API Error \((\d+)\):\s*([\s\S]*)$/;

/**
 * Normalize the assorted error shapes thrown by the various client helpers
 * into a `{ status, message }` pair.
 *
 * Recognised inputs (in priority order):
 * 1. `apiFetch`-style errors with `err.status` and `err.message` already set.
 * 2. Legacy `apiCall`/`organizationApi` errors whose `err.message` matches
 *    `API Error (<status>): <body>` (body may be JSON with a `message`).
 * 3. Plain `Error` instances - return `{ status: 0, message: err.message }`.
 */
function normalizeError(err) {
  if (!err || typeof err !== "object") {
    return { status: 0, message: "" };
  }

  const rawMessage = typeof err.message === "string" ? err.message : "";

  if (typeof err.status === "number" && err.status > 0) {
    return { status: err.status, message: rawMessage };
  }

  const match = LEGACY_API_ERROR_RE.exec(rawMessage);
  if (match) {
    const status = Number(match[1]) || 0;
    let message = match[2] || "";
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.message === "string" && parsed.message) {
        message = parsed.message;
      } else if (parsed && typeof parsed.error === "string" && parsed.error) {
        message = parsed.error;
      }
    } catch {
      // not JSON - keep the raw body
    }
    return { status, message };
  }

  return { status: 0, message: rawMessage };
}

/**
 * Map a fetch/API error to a user-friendly Sonner toast.
 *
 * Status semantics:
 * - 400: validation error -> toast.error with server message
 * - 401: session expired -> toast.error with "Please sign in again."
 * - 403: forbidden -> toast.error with server message (or generic access copy)
 * - 404: not found -> toast.error with server message
 * - 409: conflict (e.g. dedupe) -> toast.warning so it reads as "expected"
 * - >=500: server error -> toast.error with generic retry copy
 * - everything else: toast.error with err.message || fallback
 *
 * @param {{ status?: number; message?: string } | unknown} err
 * @param {string} [fallback]
 */
export function toastError(err, fallback = "Something went wrong") {
  const { status, message } = normalizeError(err);

  if (status === 400) {
    return toast.error(message || "Invalid input.");
  }
  if (status === 401) {
    return toast.error("Please sign in again.");
  }
  if (status === 403) {
    return toast.error(message || "You don't have access to this.");
  }
  if (status === 404) {
    return toast.error(message || "Not found.");
  }
  if (status === 409) {
    return toast.warning(
      message || "Conflict - already exists or was just changed.",
    );
  }
  if (status === 413) {
    return toast.error(message || "File is too large.");
  }
  if (status >= 500) {
    return toast.error("Server error - please retry.");
  }
  return toast.error(message || fallback);
}

export default toastError;
