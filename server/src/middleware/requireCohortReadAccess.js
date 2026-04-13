import mongoose from "mongoose";
import Cohort from "../models/Cohort.js";
import Deliverable from "../models/Deliverable.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError } from "../utils/apiResponse.js";
import { userIsCohortParticipant } from "../utils/cohortParticipantAccess.js";
import { mentorHasAccessToCohort } from "../utils/mentorCohortAccess.js";

async function resolveCohortId(req) {
  const cohortParam = req.params?.cohortId;
  if (cohortParam && mongoose.Types.ObjectId.isValid(String(cohortParam))) {
    return String(cohortParam);
  }
  const deliverableId = req.params?.deliverableId;
  if (deliverableId && mongoose.Types.ObjectId.isValid(String(deliverableId))) {
    const doc = await Deliverable.findById(deliverableId).select("cohortId").lean();
    if (doc?.cohortId) return String(doc.cohortId);
  }
  return null;
}

/**
 * Allows read access to cohort-scoped deliverable data for:
 * platform admins, org admins of the cohort's organization, mentors (org-linked or assigned to founders in cohort),
 * and founders/team members with CohortMembership in the cohort.
 */
export default async function requireCohortReadAccess(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  if (req.user.isAdmin === true || userRole === "admin") {
    return next();
  }

  const cohortId = await resolveCohortId(req);
  if (!cohortId) {
    return apiError(res, "Invalid cohort or deliverable identifier.", 400);
  }

  const cohort = await Cohort.findById(cohortId).select("organizationId").lean();
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }

  const orgId = cohort.organizationId ? String(cohort.organizationId) : null;

  if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
    const isOrgAdmin = await OrganizationAdmin.exists({
      organizationId: orgId,
      userId: req.user.id,
    });
    if (isOrgAdmin) {
      return next();
    }

    if (userRole === "mentor") {
      const mentorOk = await mentorHasAccessToCohort(req.user.id, cohortId, orgId);
      if (mentorOk) {
        return next();
      }
    }
  }

  if (await userIsCohortParticipant(req.user.id, cohortId)) {
    return next();
  }

  return apiError(
    res,
    "Forbidden. You do not have access to deliverables for this cohort.",
    403,
  );
}
