/**
 * Step 3.1 — shared list-query helpers for org paginated endpoints.
 */
import { API_BASE_URL } from "../../config/apiBase.js";
import { unwrapData } from "../apiEnvelope.js";

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export function buildListQueryString(params = {}) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", String(params.q));
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.skip != null) query.set("skip", String(params.skip));
  if (params.sortBy) query.set("sortBy", String(params.sortBy));
  if (params.sortOrder) query.set("sortOrder", String(params.sortOrder));
  if (params.status) query.set("status", String(params.status));

  const reserved = new Set([
    "q",
    "limit",
    "skip",
    "sortBy",
    "sortOrder",
    "status",
  ]);
  for (const [key, value] of Object.entries(params)) {
    if (reserved.has(key)) continue;
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  }

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Read items from paginated `{ items, total, limit, skip }` or legacy shapes.
 */
export function unwrapListPage(data, legacyKey) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (legacyKey && Array.isArray(data?.[legacyKey])) return data[legacyKey];
  return [];
}

export function normalizeListPage(data, legacyKey) {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit: data.length,
      skip: 0,
    };
  }
  const items = unwrapListPage(data, legacyKey);
  return {
    items,
    total: typeof data?.total === "number" ? data.total : items.length,
    limit: typeof data?.limit === "number" ? data.limit : items.length,
    skip: typeof data?.skip === "number" ? data.skip : 0,
  };
}

/**
 * GET a paginated org list endpoint; returns `{ items, total, limit, skip }`.
 */
export async function fetchOrgList(endpoint, params = {}) {
  const qs = buildListQueryString(params);
  const url = `${API_BASE_URL}${endpoint}${qs}`;
  const response = await fetch(url, { ...defaultOptions });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API Error (${response.status}): ${errorText || response.statusText}`,
    );
  }
  const json = await response.json();
  const data = unwrapData(json);
  const legacyKey = params.legacyKey;
  return normalizeListPage(data, legacyKey);
}
