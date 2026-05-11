/**
 * Single source of truth for the browser API base URL.
 *
 * Must be provided via the `VITE_API_URL` environment variable:
 *   - Local dev:    set in `client/.env.local`
 *   - Production:   set in your hosting provider (Vercel, Netlify, ...)
 *
 * Expected value: full URL including the API version prefix and NO trailing slash,
 * e.g. `https://api.startupverse.space/api/v1`.
 *
 * Endpoints are appended with a leading slash, e.g. `${API_BASE_URL}/auth/me`.
 */

const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl || typeof rawApiUrl !== "string" || !rawApiUrl.trim()) {
  throw new Error(
    "VITE_API_URL is not set. Define it in `client/.env.local` (dev) or in your hosting provider's environment variables (production).",
  );
}

export const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, "");
