import mongoose from "mongoose";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import Cohort from "../models/Cohort.js";
import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import { error as apiError } from "../utils/apiResponse.js";

function getOrganizationId(req) {
  return (
    req.params?.orgId ||
    req.params?.organizationId ||
    req.body?.organizationId ||
    req.query?.organizationId
  );
}

async function orgIdFromCohortId(cohortId) {
  if (!cohortId || !mongoose.Types.ObjectId.isValid(String(cohortId))) return null;
  const cohort = await Cohort.findById(cohortId).select("organizationId").lean();
  return cohort?.organizationId ? String(cohort.organizationId) : null;
}

async function orgIdFromDeliverableId(deliverableId) {
  if (!deliverableId || !mongoose.Types.ObjectId.isValid(String(deliverableId))) return null;
  const doc = await Deliverable.findById(deliverableId).select("organizationId cohortId").lean();
  if (!doc) return null;
  if (doc.organizationId) return String(doc.organizationId);
  if (doc.cohortId) return await orgIdFromCohortId(doc.cohortId);
  return null;
}

/**
 * Resolves owning organization for org-admin checks from explicit org id,
 * cohort id (params/body), deliverable id, or submission id.
 */
export async function resolveOrganizationIdForOrgAdmin(req) {
  const direct = getOrganizationId(req);
  if (direct) return direct;

  const cohortId = req.params?.cohortId || req.body?.cohortId;
  const fromCohort = await orgIdFromCohortId(cohortId);
  if (fromCohort) return fromCohort;

  const deliverableId = req.params?.deliverableId;
  const fromDeliverable = await orgIdFromDeliverableId(deliverableId);
  if (fromDeliverable) return fromDeliverable;

  const submissionId = req.params?.submissionId;
  if (submissionId && mongoose.Types.ObjectId.isValid(String(submissionId))) {
    const sub = await DeliverableSubmission.findById(submissionId).select("deliverableId").lean();
    if (sub?.deliverableId) {
      return await orgIdFromDeliverableId(sub.deliverableId);
    }
  }

  return null;
}

export default async function requireOrgAdmin(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  const userIsAdmin = req.user.isAdmin === true || userRole === "admin";

  if (userIsAdmin) {
    return next();
  }

  if (userRole !== "organization-admin") {
    return apiError(res, "Forbidden. Organization admin access is required.", 403);
  }

  const organizationId = await resolveOrganizationIdForOrgAdmin(req);

  if (!organizationId) {
    return apiError(
      res,
      "Organization context is required.",
      400,
      ["Provide orgId, organizationId in route params, body, or query."],
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(organizationId) ||
    !mongoose.Types.ObjectId.isValid(req.user.id)
  ) {
    return apiError(res, "Invalid organization or user identifier.", 400);
  }

  const membership = await OrganizationAdmin.exists({
    organizationId,
    userId: req.user.id,
  });

  if (!membership) {
    return apiError(
      res,
      "Forbidden. User is not an admin of this organization.",
      403,
    );
  }

  return next();
}

