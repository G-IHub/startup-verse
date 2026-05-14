import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import CohortMembership from "../models/CohortMembership.js";
import Cohort from "../models/Cohort.js";
import { success as apiSuccess } from "../utils/apiResponse.js";

const membershipsRouter = Router();

/**
 * Blueprint §14: GET /api/v1/memberships/founder/:founderId
 *
 * Returns active cohort memberships for a founder (canonical alias for
 * /cohorts/founder/:founderId). Joined data lets the client render
 * cohort context without two round-trips.
 */
membershipsRouter.get(
  "/memberships/founder/:founderId",
  requireAuth,
  requireSelfOrAdmin("founderId"),
  asyncHandler(async (req, res) => {
    const memberships = await CohortMembership.find({
      founderId: req.params.founderId,
    })
      .sort({ createdAt: -1 })
      .lean();
    const cohortIds = memberships.map((m) => m.cohortId);
    const cohorts = cohortIds.length
      ? await Cohort.find({ _id: { $in: cohortIds }, deletedAt: null }).lean()
      : [];
    const cohortById = new Map(cohorts.map((c) => [String(c._id), c]));
    const items = memberships.map((m) => ({
      id: String(m._id),
      cohortId: String(m.cohortId),
      startupId: String(m.startupId),
      founderId: String(m.founderId),
      status: m.status || "active",
      joinedAt: m.joinedAt || m.createdAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      cohort: cohortById.get(String(m.cohortId)) || null,
    }));
    return apiSuccess(res, items);
  }),
);

export default membershipsRouter;
