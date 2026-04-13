import mongoose from "mongoose";
import Deliverable from "../models/Deliverable.js";
import { error as apiError } from "../utils/apiResponse.js";
import { userIsCohortParticipant } from "../utils/cohortParticipantAccess.js";

/**
 * Only cohort participants (founder or startup in CohortMembership) may submit.
 * Platform admins may submit for testing/support.
 */
export default async function requireDeliverableSubmitAccess(req, res, next) {
  if (!req.user) {
    return apiError(res, "Unauthorized. Authentication is required.", 401);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  if (req.user.isAdmin === true || userRole === "admin") {
    return next();
  }

  const deliverableId = req.params?.deliverableId;
  if (!deliverableId || !mongoose.Types.ObjectId.isValid(String(deliverableId))) {
    return apiError(res, "Invalid deliverable identifier.", 400);
  }

  const deliverable = await Deliverable.findById(deliverableId).select("cohortId").lean();
  if (!deliverable?.cohortId) {
    return apiError(res, "Deliverable not found.", 404);
  }

  const ok = await userIsCohortParticipant(req.user.id, String(deliverable.cohortId));
  if (ok) {
    return next();
  }

  return apiError(
    res,
    "Forbidden. Only members of this deliverable's cohort can submit.",
    403,
  );
}
