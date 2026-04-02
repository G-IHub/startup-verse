/**
 * Admin Helpers
 *
 * Utilities for managing platform admin access.
 * Admins have access to debug panels and development tools.
 */

/**
 * List of admin email addresses
 *
 * Add developer/admin emails here to grant them admin access
 */
const ADMIN_EMAILS = [
  "startupverse35@gmail.com", // StartupVerse Admin - Platform Administrator
];

/**
 * Check if a user is a platform admin
 */
export function isAdmin(user) {
  if (!user) return false;

  // Check if user has isAdmin flag set
  if (user.isAdmin === true) return true;

  // Check if user's email is in the admin list
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Set admin flag on a user object
 * This should be called when creating/loading user data
 */
export function setAdminFlag(user) {
  const shouldBeAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");

  return {
    ...user,
    isAdmin: shouldBeAdmin,
  };
}

/**
 * Check if current environment allows admin features
 * In production, you might want additional checks
 */
export function adminFeaturesEnabled() {
  // Always enable for admins (they're identified by email)
  return true;

  // Alternative: Only enable in development
  // return process.env.NODE_ENV === 'development';
}

/**
 * Get all admin emails (useful for testing/documentation)
 */
export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}
