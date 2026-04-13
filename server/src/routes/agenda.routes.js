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
    const userId = req.params.userId;
    const memberships = await CohortMembership.find({ founderId: userId }).select("cohortId").lean();
    const cohortIds = [...new Set(memberships.map((m) => m.cohortId).filter(Boolean))];

    const [byFounder, byCohort, deliverables, programMilestones] = await Promise.all([
      Event.find({ founderId: userId }).sort({ startsAt: 1 }).lean(),
      cohortIds.length
        ? Event.find({ cohortId: { $in: cohortIds } }).sort({ startsAt: 1 }).lean()
        : Promise.resolve([]),
      cohortIds.length
        ? Deliverable.find({ cohortId: { $in: cohortIds } }).sort({ dueDate: 1 }).lean()
        : Promise.resolve([]),
      cohortIds.length
        ? ProgramMilestone.find({ cohortId: { $in: cohortIds } }).sort({ dueDate: 1 }).lean()
        : Promise.resolve([]),
    ]);

    const eventById = new Map();
    for (const e of [...byFounder, ...byCohort]) {
      eventById.set(String(e._id), e);
    }
    const events = Array.from(eventById.values()).sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

    const timeline = [];
    for (const e of events) {
      timeline.push({ type: "event", at: e.startsAt || null, item: e });
    }
    for (const d of deliverables) {
      timeline.push({ type: "deliverable", at: d.dueDate || null, item: d });
    }
    for (const m of programMilestones) {
      timeline.push({ type: "programMilestone", at: m.dueDate || null, item: m });
    }
    timeline.sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.at ? new Date(b.at).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

    return apiSuccess(res, {
      events,
      deliverables,
      programMilestones,
      meetings: [],
      timeline,
    });
  }),
);

export default agendaRouter;