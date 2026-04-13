import mongoose from "mongoose";
import MentorProfile from "../models/MentorProfile.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError } from "../utils/apiResponse.js";

/**
 * Removing a mentor profile: platform admins or org admins of that mentor's organization only.
 */
export default async function requireMentorProfileOrgAdmin(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const mentorProfileId = req.params.mentorId;
  if (!mentorProfileId || !mongoose.Types.ObjectId.isValid(String(mentorProfileId))) {
    return apiError(res, "Invalid mentor profile identifier.", 400);
  }

  const mentor = await MentorProfile.findById(mentorProfileId).select("organizationId").lean();
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  if (req.user.isAdmin === true || userRole === "admin") {
    return next();
  }

  const orgId = mentor.organizationId;
  if (!orgId || !mongoose.Types.ObjectId.isValid(String(orgId))) {
    return apiError(res, "Mentor profile is not linked to an organization.", 400);
  }

  const isOrgAdmin = await OrganizationAdmin.exists({
    organizationId: orgId,
    userId: req.user.id,
  });
  if (isOrgAdmin) {
    return next();
  }

  return apiError(res, "Forbidden. Only organization admins can remove mentor profiles.", 403);
}
