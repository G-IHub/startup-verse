import mongoose from "mongoose";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";

/** Resolve talent profile `userId` whether populated or raw ObjectId. */
export function resolveTalentProfileUserId(profile) {
  const uid = profile?.userId;
  if (!uid) return "";
  if (typeof uid === "object" && uid._id) return String(uid._id);
  return String(uid);
}

/**
 * User IDs on the founder's startup team — hidden from that founder's talent browse only.
 */
export async function getFounderStartupTeamUserIds(founderUserId) {
  const founderId = String(founderUserId || "").trim();
  if (!founderId || !mongoose.Types.ObjectId.isValid(founderId)) {
    return new Set();
  }

  const startup = await Startup.findOne({ founderId }, { _id: 1 }).lean();
  const startupId = startup?._id ? String(startup._id) : "";

  const profileQuery = startupId
    ? { $or: [{ founderId }, { startupId }] }
    : { founderId };
  const profiles = await TeamMemberProfile.find(profileQuery, { userId: 1 }).lean();
  const profileUserIds = profiles.map((p) => p.userId).filter(Boolean);

  const userQuery = startupId
    ? {
        $or: [
          { founderId, role: { $in: ["team-member", "team"] } },
          { startupId, role: { $in: ["team-member", "team"] } },
          { _id: { $in: profileUserIds } },
        ],
      }
    : {
        $or: [
          { founderId, role: { $in: ["team-member", "team"] } },
          { _id: { $in: profileUserIds } },
        ],
      };

  const members = await User.find(userQuery, { _id: 1 }).lean();
  return new Set(members.map((m) => String(m._id)));
}

export async function filterTalentProfilesForFounderBrowse(profiles, founderUserId) {
  const excluded = await getFounderStartupTeamUserIds(founderUserId);
  if (!excluded.size) return profiles;
  return profiles.filter((p) => !excluded.has(resolveTalentProfileUserId(p)));
}
