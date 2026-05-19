/**
 * Resolve the canonical user-facing base URL for the StartupVerse client.
 * Order of precedence:
 *   1. PUBLIC_APP_URL
 *   2. CLIENT_URL
 *   3. FRONTEND_URL
 * Returns a string with no trailing slash, or "" if none are configured.
 *
 * Used by email templates / virtual-meeting URLs so we have a single
 * source of truth for "where does the user land in the browser?".
 */
export function publicAppUrl() {
  const raw =
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "";
  return String(raw).trim().replace(/\/$/, "");
}
