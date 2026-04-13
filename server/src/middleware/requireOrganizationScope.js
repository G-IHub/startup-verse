import mongoose from "mongoose";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError } from "../utils/apiResponse.js";
import { userHasOrganizationScope } from "../utils/orgParticipantAccess.js";

/**
 * Lists cohorts (or org-scoped reads) for `:orgId` only if:
 * platform admin, org admin for that org, or user has org scope (cohort participant / org mentor).
 */
export default async function requireOrganizationScope(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const orgId = req.params.orgId || req.params.organizationId;
  if (!orgId || !mongoose.Types.ObjectId.isValid(String(orgId))) {
    return apiError(res, "Invalid organization identifier.", 400);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  if (req.user.isAdmin === true || userRole === "admin") {
    return next();
  }

  const isOrgAdmin = await OrganizationAdmin.exists({
    organizationId: orgId,
    userId: req.user.id,
  });
  if (isOrgAdmin) {
    return next();
  }

  const inScope = await userHasOrganizationScope(req.user.id, orgId);
  if (inScope) {
    return next();
  }

  return apiError(
    res,
    "Forbidden. You do not have access to this organization's cohorts.",
    403,
  );
}
