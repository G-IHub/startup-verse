import { API_BASE_URL } from "../config/apiBase.js";

/**
 * Socket.IO connects to the HTTP origin of the API, not the /api/v1 path.
 */
export function getSocketBaseUrl() {
  try {
    const u = new URL(API_BASE_URL);
    return u.origin;
  } catch {
    return "http://localhost:8000";
  }
}
