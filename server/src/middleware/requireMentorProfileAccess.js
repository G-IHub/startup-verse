import mongoose from "mongoose";
import MentorProfile from "../models/MentorProfile.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError } from "../utils/apiResponse.js";

/**
 * Mentor profile routes (`:mentorId` = MentorProfile document id):
 * platform admins, the mentor user (self), or an org admin of the profile's organization.
 */
export default async function requireMentorProfileAccess(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const mentorProfileId = req.params.mentorId;
  if (!mentorProfileId || !mongoose.Types.ObjectId.isValid(String(mentorProfileId))) {
    return apiError(res, "Invalid mentor profile identifier.", 400);
  }

  const mentor = await MentorProfile.findById(mentorProfileId).select("userId organizationId").lean();
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }

  req.mentorProfileAccess = {
    userId: mentor.userId ? String(mentor.userId) : null,
    organizationId: mentor.organizationId ? String(mentor.organizationId) : null,
  };

  const userRole = String(req.user.role || "").toLowerCase();
  if (req.user.isAdmin === true || userRole === "admin") {
    return next();
  }

  if (req.mentorProfileAccess.userId && String(req.mentorProfileAccess.userId) === String(req.user.id)) {
    return next();
  }

  const orgId = req.mentorProfileAccess.organizationId;
  if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
    const isOrgAdmin = await OrganizationAdmin.exists({
      organizationId: orgId,
      userId: req.user.id,
    });
    if (isOrgAdmin) {
      return next();
    }
  }

  return apiError(res, "Forbidden. You cannot manage this mentor profile.", 403);
}
