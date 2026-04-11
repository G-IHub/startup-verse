import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import Event from "../models/Event.js";
import Deliverable from "../models/Deliverable.js";
import ProgramMilestone from "../models/ProgramMilestone.js";
import CohortMembership from "../models/CohortMembership.js";

const agendaRouter = Router();

agendaRouter.get(
  "/agenda/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await CohortMembership.find({ startupId: req.params.startupId });
    const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);

    const [events, deliverables, milestones] = await Promise.all([
      Event.find({ cohortId: { $in: cohortIds } }).sort({ startsAt: 1 }),
      Deliverable.find({ cohortId: { $in: cohortIds } }).sort({ dueDate: 1 }),
      ProgramMilestone.find({ cohortId: { $in: cohortIds } }).sort({ dueDate: 1 }),
    ]);

    return apiSuccess(res, { events, deliverables, milestones });
  }),
);

agendaRouter.get(
  "/agenda/user/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const events = await Event.find({ founderId: req.params.userId }).sort({ startsAt: 1 });
    return apiSuccess(res, { events });
  }),
);

agendaRouter.get(
  "/agenda/:startupId/upcoming",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const memberships = await CohortMembership.find({ startupId: req.params.startupId });
    const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);
    const upcoming = await Event.find({ cohortId: { $in: cohortIds }, startsAt: { $gte: now } })
      .sort({ startsAt: 1 })
      .limit(20);

    return apiSuccess(res, upcoming);
  }),
);

agendaRouter.post(
  "/agenda/notifications/daily",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      triggered: true,
      ranAt: new Date().toISOString(),
      startupId: req.body?.startupId || null,
    });
  }),
);

agendaRouter.get(
  "/agenda/:startupId/weekly-summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await CohortMembership.find({ startupId: req.params.startupId });
    const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);

    const [eventCount, deliverableCount] = await Promise.all([
      Event.countDocuments({ cohortId: { $in: cohortIds } }),
      Deliverable.countDocuments({ cohortId: { $in: cohortIds } }),
    ]);

    return apiSuccess(res, {
      startupId: req.params.startupId,
      eventCount,
      deliverableCount,
      generatedAt: new Date().toISOString(),
    });
  }),
);

agendaRouter.get(
  "/calendar/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const events = await Event.find({ founderId: req.params.userId }).sort({ startsAt: 1 });
    return apiSuccess(res, { events });
  }),
);

export default agendaRouter;