import { API_BASE_URL } from "../config/apiBase.js";

/**
 * Socket.IO connects to the HTTP origin of the API (no path), derived from
 * the same `VITE_API_URL` env var that drives the REST client.
 */
export function getSocketBaseUrl() {
  return new URL(API_BASE_URL).origin;
}
