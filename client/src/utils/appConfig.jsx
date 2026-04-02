/**
 * App Configuration
 * Central place for app-wide settings
 */

// ✅ Your custom domain for StartupVerse
export const PRODUCTION_URL = "https://startupverse.space";

/**
 * Get the correct app URL for email links and redirects
 */
export function getAppUrl() {
  // ✅ Use custom domain for email links
  return PRODUCTION_URL;
}

/**
 * Get the invitation link URL for a given token
 */
export function getInvitationUrl(token) {
  return `${getAppUrl()}?invitation=${token}`;
}
