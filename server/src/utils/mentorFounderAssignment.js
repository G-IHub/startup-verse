import mongoose from "mongoose";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";

/**
 * Ensures a founder belongs to the mentor's organization (specific cohort or any org cohort).
 */
export async function assertFounderInMentorOrganization(founderId, mentorOrgId, cohortId) {
  if (!founderId || !mentorOrgId) {
    return { ok: false, message: "Missing founder or organization context." };
  }
  if (!mongoose.Types.ObjectId.isValid(String(founderId))) {
    return { ok: false, message: "Invalid founder identifier." };
  }

  if (cohortId && mongoose.Types.ObjectId.isValid(String(cohortId))) {
    const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null })
      .select("organizationId")
      .lean();
    if (!cohort) {
      return { ok: false, message: "Cohort not found." };
    }
    if (String(cohort.organizationId) !== String(mentorOrgId)) {
      return { ok: false, message: "Cohort does not belong to this mentor's organization." };
    }
    const inCohort = await CohortMembership.exists({
      cohortId,
      founderId,
    });
    if (!inCohort) {
      return { ok: false, message: "Founder is not a member of this cohort." };
    }
    return { ok: true };
  }

  const cohorts = await Cohort.find({
    organizationId: mentorOrgId,
    deletedAt: null,
  })
    .select("_id")
    .lean();
  const cohortIds = cohorts.map((c) => c._id);
  if (!cohortIds.length) {
    return { ok: false, message: "Organization has no cohorts." };
  }
  const ok = await CohortMembership.exists({
    founderId,
    cohortId: { $in: cohortIds },
  });
  return ok
    ? { ok: true }
    : { ok: false, message: "Founder is not enrolled in this organization's cohorts." };
}
