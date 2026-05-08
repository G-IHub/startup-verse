import axios from "axios";
import { API_BASE_URL } from "../config/apiBase.js";

/**
 * Shared Axios client for the founder Home wiring.
 *
 * Responsibilities:
 * - Base URL from `VITE_API_URL` (via `apiBase.js`).
 * - Cookie-based auth (credentials: include) - no manual token handling needed.
 * - Response interceptor that unwraps the `{ success, data }` envelope used by the backend,
 *   keeping parity with `utils/backendClient.js` so stores can consume `data` directly.
 * - Normalized error object `{ status, code, message, details, isApiError }`
 *   and a `session:unauthorized` DOM event on 401s so the app shell can react.
 * - Request ID header for traceability and sensible timeouts.
 * - AbortController helper for cancelation.
 */

const REQUEST_TIMEOUT_MS = 20000;

function generateRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function emitUnauthorized(detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("session:unauthorized", { detail }));
  } catch {
    // noop
  }
}

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message || `HTTP ${status || "error"}`);
    this.name = "ApiError";
    this.status = status ?? 0;
    this.code = code ?? null;
    this.details = details ?? null;
    this.isApiError = true;
  }
}

function normalizeAxiosError(error) {
  if (axios.isCancel?.(error) || error?.name === "CanceledError") {
    return new ApiError({
      status: 0,
      code: "CANCELED",
      message: "Request canceled",
      details: null,
    });
  }

  const response = error?.response;
  const payload = response?.data;
  const status = response?.status ?? 0;

  const message =
    (payload && typeof payload === "object" &&
      (payload.message || payload.error || payload.data?.message)) ||
    error?.message ||
    `HTTP ${status || "error"}`;

  const code =
    (payload && typeof payload === "object" && (payload.code || payload.data?.code)) || null;

  return new ApiError({
    status,
    code,
    message,
    details: payload && typeof payload === "object" ? payload : null,
  });
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true, // Enable cookie-based auth
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (!config.headers["X-Request-Id"]) {
    config.headers["X-Request-Id"] = generateRequestId();
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response?.data;

    if (!payload || typeof payload !== "object") {
      throw new ApiError({
        status: response.status,
        code: "INVALID_RESPONSE",
        message: `Invalid JSON response from ${response.config?.url || "API"}`,
        details: payload ?? null,
      });
    }

    if (payload.success !== true || !Object.prototype.hasOwnProperty.call(payload, "data")) {
      throw new ApiError({
        status: response.status,
        code: "INVALID_ENVELOPE",
        message: payload.message || `Invalid API envelope from ${response.config?.url || "API"}`,
        details: payload,
      });
    }

    return payload.data;
  },
  (error) => {
    const normalized = normalizeAxiosError(error);
    if (normalized.status === 401) {
      emitUnauthorized({
        url: error?.config?.url,
        method: error?.config?.method,
      });
    }
    return Promise.reject(normalized);
  },
);

/** Creates an AbortController for a request. Returns `{ signal, abort }`. */
export function createAbort() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: (reason) => controller.abort(reason),
  };
}

export async function apiGet(url, config = {}) {
  return apiClient.get(url, config);
}

export async function apiPost(url, body, config = {}) {
  return apiClient.post(url, body, config);
}

export async function apiPut(url, body, config = {}) {
  return apiClient.put(url, body, config);
}

export async function apiPatch(url, body, config = {}) {
  return apiClient.patch(url, body, config);
}

export async function apiDelete(url, config = {}) {
  return apiClient.delete(url, config);
}

export default apiClient;
