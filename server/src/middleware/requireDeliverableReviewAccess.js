import mongoose from "mongoose";
import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError } from "../utils/apiResponse.js";
import { mentorHasAccessToCohort } from "../utils/mentorCohortAccess.js";
import { resolveOrganizationIdForOrgAdmin } from "./requireOrgAdmin.js";

async function resolveCohortIdFromSubmission(req) {
  const submissionId = req.params?.submissionId;
  if (!submissionId || !mongoose.Types.ObjectId.isValid(String(submissionId))) {
    return null;
  }
  const sub = await DeliverableSubmission.findById(submissionId).select("deliverableId").lean();
  if (!sub?.deliverableId) return null;
  const d = await Deliverable.findById(sub.deliverableId).select("cohortId").lean();
  return d?.cohortId ? String(d.cohortId) : null;
}

/**
 * Who may review a submission: platform admins, org admins of the owning organization,
 * and mentors (org-linked or assigned to a founder in the deliverable's cohort).
 */
export default async function requireDeliverableReviewAccess(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  if (req.user.isAdmin === true || userRole === "admin") {
    return next();
  }

  const organizationId = await resolveOrganizationIdForOrgAdmin(req);

  if (!organizationId) {
    return apiError(
      res,
      "Organization context could not be resolved for this submission.",
      400,
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(String(organizationId)) ||
    !mongoose.Types.ObjectId.isValid(String(req.user.id))
  ) {
    return apiError(res, "Invalid organization or user identifier.", 400);
  }

  const isOrgAdmin = await OrganizationAdmin.exists({
    organizationId: organizationId,
    userId: req.user.id,
  });
  if (isOrgAdmin) {
    return next();
  }

  if (userRole === "mentor") {
    const cohortId = await resolveCohortIdFromSubmission(req);
    if (cohortId) {
      const mentorOk = await mentorHasAccessToCohort(req.user.id, cohortId, organizationId);
      if (mentorOk) {
        return next();
      }
    }
  }

  return apiError(
    res,
    "Forbidden. Only organization admins and assigned mentors can review submissions.",
    403,
  );
}
