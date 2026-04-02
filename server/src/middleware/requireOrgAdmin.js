import mongoose from "mongoose";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError } from "../utils/apiResponse.js";

function getOrganizationId(req) {
  return (
    req.params?.orgId ||
    req.params?.organizationId ||
    req.body?.organizationId ||
    req.query?.organizationId
  );
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

  const organizationId = getOrganizationId(req);

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

