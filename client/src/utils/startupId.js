/**
 * Utility to get the correct startupId for a user
 *
 * CRITICAL: This ensures founders and team members use the SAME startupId
 * for messaging, conversations, and all startup-scoped data.
 *
 * Logic:
 * - Founders: Use their own user.id as the startupId
 * - Team Members: Use their founderId or startupId (which should point to the founder's ID)
 * - Fallback: Use user.id if nothing else is available
 *
 * This prevents the bug where founders and team members look in different "buckets"
 * for messages and other startup data.
 */

export function getStartupId(user) {
  const resolvedId = user._id ?? user.id;
  if (user.role === "founder") {
    // Founders ARE the startup - use their ID
    return resolvedId;
  }

  // Team members, talent, etc. - use their startup/founder reference
  return user.startupId || user.founderId || resolvedId;
}

/**
 * Get the founder ID for a user (same as getStartupId in most cases)
 * This is useful when you specifically need the founder's ID
 */
export function getFounderId(user) {
  return getStartupId(user);
}
