import { getAccessToken } from "../app/session";

/**
 * Canonical backend client for Phase 1 contract lock.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthToken() {
  return getAccessToken();
}

function buildUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

async function parseEnvelope(response, endpoint) {
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

export async function request(endpoint, options = {}) {
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
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
