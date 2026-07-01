/**
 * Build FounderProfile API payload from user + profile state.
 */
export function buildFounderProfilePayload(user, overrides = {}) {
  const p = user?.profile && typeof user.profile === "object" ? user.profile : {};
  return {
    userId: String(user._id ?? user.id ?? ""),
    startupId: user.startupId,
    bio: overrides.bio ?? user.bio ?? p.bio ?? "",
    background: overrides.background ?? p.background ?? "",
    links: overrides.links ?? p.links ?? {},
    targetAudience: overrides.targetAudience ?? p.targetAudience ?? user.targetAudience ?? [],
    rolesNeeded: overrides.rolesNeeded ?? p.rolesNeeded ?? user.rolesNeeded ?? [],
    teamSize: overrides.teamSize ?? p.teamSize ?? user.teamSize ?? "",
    hasValidatedIdea:
      overrides.hasValidatedIdea ?? p.hasValidatedIdea ?? user.hasValidatedIdea ?? "",
    hasMVP: overrides.hasMVP ?? p.hasMVP ?? user.hasMVP ?? "",
    hasCustomers: overrides.hasCustomers ?? p.hasCustomers ?? user.hasCustomers ?? "",
  };
}
