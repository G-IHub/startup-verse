import { API_BASE_URL } from "../config/apiBase.js";

/**
 * Canonical backend client for Phase 1 contract lock.
 * Uses cookie-based authentication (HttpOnly cookies).
 */

export { API_BASE_URL };

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

function buildUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

export async function parseEnvelopeResponse(response, endpoint) {
  const payload = await response.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid JSON response from ${endpoint}`);
  }

  if (!response.ok) {
    const message =
      payload.message ||
      payload.error ||
      `HTTP ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (payload.success !== true || !Object.prototype.hasOwnProperty.call(payload, "data")) {
    throw new Error(`Invalid API envelope from ${endpoint}`);
  }

  return payload;
}

async function parseEnvelope(response, endpoint) {
  return parseEnvelopeResponse(response, endpoint);
}

/**
 * Like `fetch(buildUrl(path), init)` but validates `{ success, data }` on HTTP success.
 * Use when migrating off ad-hoc `fetch` + manual JSON handling.
 */
export async function fetchEnvelope(path, init = {}) {
  const response = await fetch(buildUrl(path), {
    ...defaultOptions,
    ...init,
    headers: {
      ...defaultOptions.headers,
      ...init.headers,
    },
  });
  return parseEnvelopeResponse(response, path);
}

/** Returns parsed envelope or `null` if network / non-envelope / HTTP error (no throw). */
export async function tryRequest(endpoint, options = {}) {
  try {
    return await request(endpoint, options);
  } catch {
    return null;
  }
}

export async function request(endpoint, options = {}) {
  const response = await fetch(buildUrl(endpoint), {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  return parseEnvelope(response, endpoint);
}

export async function get(endpoint, options = {}) {
  return request(endpoint, { ...options, method: "GET" });
}

export async function post(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function put(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function patch(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: "DELETE" });
}
