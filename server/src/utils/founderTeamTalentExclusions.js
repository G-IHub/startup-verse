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
  const profileUserIds = profiles
    .map((p) => p.userId)
    .filter(Boolean)
    .map((id) => String(id));

  const excluded = new Set(profileUserIds);

  const memberQueries = [];

  if (startupId) {
    memberQueries.push({ startupId });
    memberQueries.push({ founderId });
  } else {
    memberQueries.push({ founderId });
  }

  for (const query of memberQueries) {
    const users = await User.find(query, { _id: 1 }).lean();
    for (const user of users) {
      excluded.add(String(user._id));
    }
  }

  const teamRoleUsers = await User.find(
    startupId
      ? {
          role: { $in: ["team-member", "team"] },
          $or: [{ founderId }, { startupId }, { _id: { $in: profileUserIds } }],
        }
      : {
          role: { $in: ["team-member", "team"] },
          $or: [{ founderId }, { _id: { $in: profileUserIds } }],
        },
    { _id: 1 },
  ).lean();

  for (const user of teamRoleUsers) {
    excluded.add(String(user._id));
  }

  return excluded;
}

export async function filterTalentProfilesForFounderBrowse(profiles, founderUserId) {
  const excluded = await getFounderStartupTeamUserIds(founderUserId);
  if (!excluded.size) return profiles;
  return profiles.filter((p) => !excluded.has(resolveTalentProfileUserId(p)));
}
