import Startup from "../models/Startup.js";
import User from "../models/User.js";
import CohortMembership from "../models/CohortMembership.js";
import CohortInvitation from "../models/CohortInvitation.js";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * List registered startups that are not yet members of the given cohort.
 * Annotates rows with pending invite status for this cohort.
 */
export async function loadAvailableStartupsForCohort(
  cohortId,
  { q = "", page = 1, pageSize = 50 } = {},
) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limit = Math.min(100, Math.max(1, Number(pageSize) || 50));
  const skip = (pageNum - 1) * limit;

  const memberships = await CohortMembership.find({ cohortId })
    .select("startupId")
    .lean();
  const memberStartupIds = memberships
    .map((membership) => membership.startupId)
    .filter(Boolean);

  const pendingInvites = await CohortInvitation.find({
    cohortId,
    status: "pending",
  })
    .select("founderId")
    .lean();
  const pendingFounderIds = new Set(
    pendingInvites
      .map((invite) => (invite.founderId ? String(invite.founderId) : ""))
      .filter(Boolean),
  );

  const filter = {
    _id: { $nin: memberStartupIds },
  };

  const trimmedQuery = String(q || "").trim();
  if (trimmedQuery) {
    const searchRegex = new RegExp(escapeRegex(trimmedQuery), "i");
    filter.$or = [
      { name: searchRegex },
      { industry: searchRegex },
      { stage: searchRegex },
    ];
  }

  const [startups, total] = await Promise.all([
    Startup.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Startup.countDocuments(filter),
  ]);

  const founderIds = startups.map((startup) => startup.founderId).filter(Boolean);
  const founders = founderIds.length
    ? await User.find({ _id: { $in: founderIds }, role: "founder" })
        .select("name email")
        .lean()
    : [];
  const founderMap = new Map(
    founders.map((founder) => [String(founder._id), founder]),
  );

  const items = startups
    .map((startup) => {
      const founderId = startup.founderId ? String(startup.founderId) : "";
      const founder = founderMap.get(founderId);
      if (!founderId || !founder) return null;

      return {
        id: String(startup._id),
        name: startup.name || "Unnamed Startup",
        description: startup.description || "",
        industry: startup.industry || "",
        stage: startup.stage || "",
        logoUrl: startup.logo || "",
        founderId,
        founderName: founder.name || "",
        founderEmail: founder.email || "",
        inviteStatus: pendingFounderIds.has(founderId) ? "pending" : null,
      };
    })
    .filter(Boolean);

  return {
    items,
    total,
    page: pageNum,
    pageSize: limit,
  };
}
