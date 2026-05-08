/**
 * Single source of truth for the browser API base (`/api/v1` prefix URL).
 * Import from here or from `utils/backendClient.js` (re-exported).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
