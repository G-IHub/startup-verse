import Startup from "../models/Startup.js";

export async function resolveCanonicalStartupId(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return null;

  const byId = await Startup.findById(value, { _id: 1, founderId: 1 }).lean();
  if (byId?._id) {
    return {
      startupId: String(byId._id),
      founderId: String(byId.founderId || ""),
    };
  }

  const byFounder = await Startup.findOne({ founderId: value }, { _id: 1, founderId: 1 }).lean();
  if (byFounder?._id) {
    return {
      startupId: String(byFounder._id),
      founderId: String(byFounder.founderId || value),
    };
  }

  return null;
}

/**
 * Resolve the startup bucket a user belongs to (founder + team members).
 * Mirrors client getStartupId: founders use their user id; team members use founderId.
 */
export async function resolveUserStartupScope(user) {
  if (!user) return null;

  const userId = String(user._id || user.id || "");
  const role = String(user.role || "");
  const candidateIds = [user.startupId, user.founderId].filter(Boolean);

  if (role === "founder" && userId) {
    candidateIds.unshift(userId);
  }

  for (const candidateId of candidateIds) {
    const scope = await resolveCanonicalStartupId(candidateId);
    if (scope) return scope;
  }

  if (role === "founder" && userId) {
    return { startupId: userId, founderId: userId };
  }

  const founderRef = String(user.founderId || user.startupId || "");
  if (founderRef) {
    return { startupId: founderRef, founderId: founderRef };
  }

  return null;
}

/** Socket / client bucket id — prefer founder id so founders and team members share a room. */
export function getClientStartupBucketId(scope) {
  if (!scope) return "";
  return String(scope.founderId || scope.startupId || "");
}

export async function usersShareStartupScope(userA, userB) {
  const scopeA = await resolveUserStartupScope(userA);
  const scopeB = await resolveUserStartupScope(userB);
  if (!scopeA || !scopeB) return false;

  const bucketA = getClientStartupBucketId(scopeA);
  const bucketB = getClientStartupBucketId(scopeB);
  if (bucketA && bucketA === bucketB) return true;

  const idsA = new Set([scopeA.startupId, scopeA.founderId, bucketA].filter(Boolean));
  const idsB = new Set([scopeB.startupId, scopeB.founderId, bucketB].filter(Boolean));

  for (const id of idsA) {
    if (idsB.has(id)) return true;
  }

  return false;
}
