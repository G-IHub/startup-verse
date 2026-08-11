import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import CohortMembership from "../models/CohortMembership.js";
import Cohort from "../models/Cohort.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import {
  resolveCanonicalStartupId,
  resolveUserStartupScope,
} from "../utils/startupScope.js";

const membershipsRouter = Router();

async function enrichMembershipItems(memberships) {
  const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);
  const cohorts = cohortIds.length
    ? await Cohort.find({ _id: { $in: cohortIds }, deletedAt: null }).lean()
    : [];
  const orgIds = [
    ...new Set(
      cohorts
        .map((c) => (c.organizationId ? String(c.organizationId) : ""))
        .filter(Boolean),
    ),
  ];
  const orgs = orgIds.length
    ? await Organization.find({ _id: { $in: orgIds } })
        .select("name logo website")
        .lean()
    : [];
  const cohortById = new Map(cohorts.map((c) => [String(c._id), c]));
  const orgById = new Map(orgs.map((o) => [String(o._id), o]));

  return memberships.map((m) => {
    const cohort = cohortById.get(String(m.cohortId)) || null;
    const orgId = cohort?.organizationId ? String(cohort.organizationId) : null;
    const organization = orgId ? orgById.get(orgId) || null : null;
    return {
      id: String(m._id),
      cohortId: String(m.cohortId),
      startupId: String(m.startupId),
      founderId: String(m.founderId),
      status: m.status || "active",
      joinedAt: m.joinedAt || m.createdAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      organizationId: orgId,
      cohort: cohort
        ? {
            id: String(cohort._id),
            _id: String(cohort._id),
            name: cohort.name || "",
            description: cohort.description || "",
            status: cohort.status || "active",
            startDate: cohort.startDate || null,
            endDate: cohort.endDate || null,
            organizationId: orgId,
          }
        : null,
      organization: organization
        ? {
            id: String(organization._id),
            _id: String(organization._id),
            name: organization.name || "",
            logo: organization.logo || "",
            website: organization.website || "",
          }
        : null,
    };
  });
}

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
  asyncHandler(async (req, res) => {
    const founderId = String(req.params.founderId || "").trim();
    if (!founderId) {
      return apiError(res, "founderId is required.", 400);
    }

    const role = String(req.user?.role || "").toLowerCase();
    const isAdmin = req.user?.isAdmin === true || role === "admin";
    const isSelf = String(req.user?.id) === founderId;
    if (!isAdmin && !isSelf) {
      const me = await User.findById(req.user.id)
        .select("role startupId founderId")
        .lean();
      const teamRole = String(me?.role || role);
      const isTeam = teamRole === "team-member" || teamRole === "team";
      const linked = String(me?.founderId || me?.startupId || "");
      if (!isTeam || linked !== founderId) {
        return apiError(res, "Forbidden. You can only access your own resources.", 403);
      }
    }

    const memberships = await CohortMembership.find({ founderId })
      .sort({ createdAt: -1 })
      .lean();
    const items = await enrichMembershipItems(memberships);
    return apiSuccess(res, items);
  }),
);

/**
 * GET /api/v1/memberships/startup/:startupId
 *
 * Memberships for a startup bucket. Authorized for the startup founder or a
 * team member whose scope matches the startup.
 */
membershipsRouter.get(
  "/memberships/startup/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawId = String(req.params.startupId || "").trim();
    if (!rawId) {
      return apiError(res, "startupId is required.", 400);
    }

    let requested = await resolveCanonicalStartupId(rawId);
    if (!requested) {
      // Allow founder user id when no Startup document exists yet.
      requested = { startupId: rawId, founderId: rawId };
    }

    const role = String(req.user?.role || "").toLowerCase();
    const isAdmin = req.user?.isAdmin === true || role === "admin";
    if (!isAdmin) {
      const me = await User.findById(req.user.id)
        .select("role startupId founderId")
        .lean();
      const scope = await resolveUserStartupScope({
        ...me,
        _id: req.user.id,
        id: req.user.id,
        role: me?.role || role,
      });
      const allowedIds = new Set(
        [
          scope?.startupId,
          scope?.founderId,
          req.user.id,
          me?.startupId,
          me?.founderId,
        ]
          .filter(Boolean)
          .map(String),
      );
      if (
        !allowedIds.has(String(requested.startupId)) &&
        !allowedIds.has(String(requested.founderId)) &&
        !allowedIds.has(rawId)
      ) {
        return apiError(res, "Forbidden.", 403);
      }
    }

    const memberships = await CohortMembership.find({
      $or: [
        { startupId: requested.startupId },
        ...(requested.founderId ? [{ founderId: requested.founderId }] : []),
        { startupId: rawId },
        { founderId: rawId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const seen = new Set();
    const unique = [];
    for (const row of memberships) {
      const id = String(row._id);
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(row);
    }

    const items = await enrichMembershipItems(unique);
    return apiSuccess(res, items);
  }),
);

export default membershipsRouter;
