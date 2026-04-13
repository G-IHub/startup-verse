import mongoose from "mongoose";
import CohortMembership from "../models/CohortMembership.js";
import User from "../models/User.js";

/**
 * True if the user is a founder or team member on a startup in this cohort
 * (matches CohortMembership by founderId or startupId from User).
 */
export async function userIsCohortParticipant(userId, cohortId) {
  if (!userId || !cohortId || !mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return false;
  }

  const userDoc = await User.findById(userId).select("startupId").lean();
  const startupId = userDoc?.startupId;

  const cohortObjectId = new mongoose.Types.ObjectId(cohortId);
  const orConditions = [{ founderId: userId }];
  if (startupId && mongoose.Types.ObjectId.isValid(String(startupId))) {
    orConditions.push({ startupId });
  }

  return CohortMembership.exists({
    cohortId: cohortObjectId,
    $or: orConditions,
  });
}
