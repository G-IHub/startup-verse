import mongoose from "mongoose";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import MentorProfile from "../models/MentorProfile.js";
import User from "../models/User.js";

/**
 * User is tied to an organization if they are in any of its cohorts (founder or startup)
 * or have a mentor profile for that organization.
 */
export async function userHasOrganizationScope(userId, organizationId) {
  if (!userId || !organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    return false;
  }

  const cohorts = await Cohort.find({ organizationId, deletedAt: null })
    .select("_id")
    .lean();
  const cohortIds = cohorts.map((c) => c._id);
  if (!cohortIds.length) {
    return false;
  }

  const userDoc = await User.findById(userId).select("startupId").lean();
  const startupId = userDoc?.startupId;
  const orConditions = [{ founderId: userId }];
  if (startupId && mongoose.Types.ObjectId.isValid(String(startupId))) {
    orConditions.push({ startupId });
  }

  const inCohort = await CohortMembership.exists({
    cohortId: { $in: cohortIds },
    $or: orConditions,
  });
  if (inCohort) {
    return true;
  }

  return MentorProfile.exists({ userId, organizationId });
}
