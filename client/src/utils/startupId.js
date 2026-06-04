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
  if (!user) return "";
  const resolvedId = String(user._id ?? user.id ?? "");
  const role = String(user.role || "");

  if (role === "founder") {
    return resolvedId;
  }

  const founderRef = String(
    user.founderId || user.founder_id || user.startupId || user.startup_id || "",
  );

  // Team members must share the founder's startup bucket — never use their own user id.
  if (role === "team-member" || role === "team") {
    return founderRef;
  }

  return founderRef || resolvedId;
}

/**
 * Get the founder ID for a user (same as getStartupId in most cases)
 * This is useful when you specifically need the founder's ID
 */
export function getFounderId(user) {
  return getStartupId(user);
}
