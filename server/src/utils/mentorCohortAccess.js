import mongoose from "mongoose";
import CohortMembership from "../models/CohortMembership.js";
import MentorProfile from "../models/MentorProfile.js";

/**
 * Mentor may access cohort-scoped data if:
 * - MentorProfile.organizationId matches the cohort's organization, or
 * - Mentor has assigned founders and at least one is a member of this cohort.
 */
export async function mentorHasAccessToCohort(userId, cohortId, organizationId) {
  if (!userId || !cohortId) return false;

  const profile = await MentorProfile.findOne({ userId }).lean();
  if (!profile) return false;

  if (
    organizationId &&
    profile.organizationId &&
    String(profile.organizationId) === String(organizationId)
  ) {
    return true;
  }

  const assigned = new Set((profile.assignedFounders || []).map((id) => String(id)));
  if (assigned.size === 0) return false;

  if (!mongoose.Types.ObjectId.isValid(String(cohortId))) return false;
  const members = await CohortMembership.find({
    cohortId: new mongoose.Types.ObjectId(cohortId),
  })
    .select("founderId")
    .lean();

  return members.some((m) => m.founderId && assigned.has(String(m.founderId)));
}
