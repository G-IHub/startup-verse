import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess, error as apiError } from "../utils/apiResponse.js";
import Event from "../models/Event.js";
import Deliverable from "../models/Deliverable.js";
import ProgramMilestone from "../models/ProgramMilestone.js";
import CohortMembership from "../models/CohortMembership.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import Meeting from "../models/Meeting.js";
import {
  mapToTimelineItem,
  buildSortedTimeline,
  filterTimelineByWindow,
} from "../utils/calendarDto.js";

const agendaRouter = Router();

const isSelfOrAdmin = (req, userId) =>
  req.user?.isAdmin === true || req.user?.id === String(userId);

const normalize = (value) => String(value || "").trim();

async function resolveCanonicalStartupId(rawValue) {
  const value = normalize(rawValue);
  if (!value) return null;
  const byId = await Startup.findById(value, { _id: 1 });
  if (byId?._id) return String(byId._id);
  const byFounder = await Startup.findOne({ founderId: value }, { _id: 1 });
  return byFounder?._id ? String(byFounder._id) : null;
}

async function canAccessStartupForAgenda(req, startupId) {
  const requestedCanonicalId = await resolveCanonicalStartupId(startupId);
  if (!requestedCanonicalId) return null;
  if (req.user?.isAdmin) return requestedCanonicalId;

  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return null;

  const candidateIds = [req.user.id, me.startupId, me.founderId];
  for (const candidateId of candidateIds) {
    const canonicalCandidate = await resolveCanonicalStartupId(candidateId);
    if (canonicalCandidate && canonicalCandidate === requestedCanonicalId) {
      return requestedCanonicalId;
    }
  }
  return null;
}

async function getCohortIdsForCalendarUser(userId) {
  const set = new Set();
  const addRows = (rows) => {
    for (const m of rows) {
      if (m.cohortId) set.add(String(m.cohortId));
    }
  };

  addRows(
    await CohortMembership.find({ founderId: userId }).select("cohortId").lean(),
  );

  const me = await User.findById(userId, { startupId: 1, founderId: 1 }).lean();
  if (me) {
    const candidates = [userId, me.startupId, me.founderId].filter(Boolean);
    for (const c of candidates) {
      const canon = await resolveCanonicalStartupId(c);
      if (canon) {
        addRows(
          await CohortMembership.find({ startupId: canon }).select("cohortId").lean(),
        );
      }
    }
  }

  return [...set];
}

function parseCalendarWindow(req) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now.getTime() + 90 * 86400000);

  if (req.query?.start) {
    const s = new Date(String(req.query.start));
    if (Number.isFinite(s.getTime())) start = s;
  }
  if (req.query?.end) {
    const e = new Date(String(req.query.end));
    if (Number.isFinite(e.getTime())) end = e;
  }

  if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 86400000);
  }

  const maxMs = 366 * 86400000;
  if (end.getTime() - start.getTime() > maxMs) {
    end = new Date(start.getTime() + maxMs);
  }

  return { start, end };
}

function parseAgendaDateRange(req) {
  const startRaw = req.query?.startDate || req.query?.start;
  const endRaw = req.query?.endDate || req.query?.end;
  if (!startRaw && !endRaw) return null;
  const start = startRaw ? new Date(String(startRaw)) : null;
  const end = endRaw ? new Date(String(endRaw)) : null;
  if (start && !Number.isFinite(start.getTime())) return null;
  if (end && !Number.isFinite(end.getTime())) return null;
  return {
    start: start || new Date(0),
    end: end || new Date(8640000000000000),
  };
}

function mapMeetingToTimelineItem(m, now) {
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  // Build a real Date from date string + startTime string
  const atDate = m.date
    ? new Date(`${m.date}T${m.startTime || "00:00"}:00`)
    : null;
  const endDate = m.date && m.endTime
    ? new Date(`${m.date}T${m.endTime}:00`)
    : null;
  const isOverdue = Boolean(atDate && atDate.getTime() < todayStart.getTime());
  return {
    kind: "meeting",
    id: String(m._id),
    title: String(m.title || "Meeting"),
    at: atDate ? atDate.toISOString() : null,
    endAt: endDate ? endDate.toISOString() : null,
    cohortId: null,
    startupId: m.startupId ? String(m.startupId) : null,
    status: m.status || "scheduled",
    isOverdue,
    agendaType: "meeting",
    type: "meeting",
    date: m.date || "",
    dueDate: m.date || "",
    startTime: m.startTime || null,
    endTime: m.endTime || null,
    color: "#7c3aed",
    metadata: {
      type: m.type || "meeting",
      description: String(m.description || ""),
      location: String(m.location || ""),
      attendees: m.attendees || [],
    },
  };
}

async function loadCalendarDataForUser(userId, windowStart, windowEnd) {
  const cohortIds = await getCohortIdsForCalendarUser(userId);
  const cohortObjIds = cohortIds;

  const eventQueryBase = { startsAt: { $gte: windowStart, $lte: windowEnd } };
  const [byFounder, byCohort, deliverables, programMilestones, userMeetings] = await Promise.all([
    Event.find({ founderId: userId, ...eventQueryBase }).sort({ startsAt: 1 }).lean(),
    cohortObjIds.length
      ? Event.find({
          cohortId: { $in: cohortObjIds },
          ...eventQueryBase,
        })
          .sort({ startsAt: 1 })
          .lean()
      : Promise.resolve([]),
    cohortObjIds.length
      ? Deliverable.find({
          cohortId: { $in: cohortObjIds },
          dueDate: { $gte: windowStart, $lte: windowEnd },
        })
          .sort({ dueDate: 1 })
          .lean()
      : Promise.resolve([]),
    cohortObjIds.length
      ? ProgramMilestone.find({
          cohortId: { $in: cohortObjIds },
          dueDate: { $gte: windowStart, $lte: windowEnd },
        })
          .sort({ dueDate: 1 })
          .lean()
      : Promise.resolve([]),
    Meeting.find({
      $or: [{ organizerId: userId }, { attendees: userId }],
      date: {
        $gte: windowStart.toISOString().slice(0, 10),
        $lte: windowEnd.toISOString().slice(0, 10),
      },
      status: { $ne: "cancelled" },
    }).sort({ date: 1, startTime: 1 }).lean(),
  ]);

  const eventById = new Map();
  for (const e of [...byFounder, ...byCohort]) {
    eventById.set(String(e._id), e);
  }
  const events = Array.from(eventById.values()).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const now = new Date();
  const items = [];
  for (const e of events) {
    items.push(mapToTimelineItem(e, "event", now));
  }
  for (const d of deliverables) {
    items.push(mapToTimelineItem(d, "deliverable", now));
  }
  for (const m of programMilestones) {
    items.push(mapToTimelineItem(m, "programMilestone", now));
  }
  for (const m of userMeetings) {
    items.push(mapMeetingToTimelineItem(m, now));
  }

  const timeline = buildSortedTimeline(items);
  return { events, deliverables, programMilestones, meetings: userMeetings, timeline };
}

agendaRouter.get(
  "/agenda/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const canonicalStartupId = await canAccessStartupForAgenda(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }

    const range = parseAgendaDateRange(req);
    const memberships = await CohortMembership.find({ startupId: canonicalStartupId });
    const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);

    const eventFind = { cohortId: { $in: cohortIds } };
    const delFind = { cohortId: { $in: cohortIds } };
    const milFind = { cohortId: { $in: cohortIds } };
    if (range) {
      eventFind.startsAt = { $gte: range.start, $lte: range.end };
      delFind.dueDate = { $gte: range.start, $lte: range.end };
      milFind.dueDate = { $gte: range.start, $lte: range.end };
    }

    const [events, deliverables, milestones] = await Promise.all([
      Event.find(eventFind).sort({ startsAt: 1 }).lean(),
      Deliverable.find(delFind).sort({ dueDate: 1 }).lean(),
      ProgramMilestone.find(milFind).sort({ dueDate: 1 }).lean(),
    ]);

    const now = new Date();
    const agenda = [];
    for (const e of events) agenda.push(mapToTimelineItem(e, "event", now));
    for (const d of deliverables) agenda.push(mapToTimelineItem(d, "deliverable", now));
    for (const m of milestones) agenda.push(mapToTimelineItem(m, "programMilestone", now));

    return apiSuccess(res, {
      events,
      deliverables,
      milestones,
      timeline: buildSortedTimeline(agenda),
      agenda: buildSortedTimeline(agenda),
    });
  }),
);

agendaRouter.get(
  "/agenda/user/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isSelfOrAdmin(req, req.params.userId)) {
      return apiError(res, "Forbidden.", 403);
    }
    const events = await Event.find({ founderId: req.params.userId }).sort({ startsAt: 1 }).lean();
    return apiSuccess(res, { events });
  }),
);

agendaRouter.get(
  "/agenda/:startupId/upcoming",
  requireAuth,
  asyncHandler(async (req, res) => {
    const canonicalStartupId = await canAccessStartupForAgenda(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }

    const parsedDays = Number.parseInt(String(req.query?.days || "14"), 10);
    const days = Math.max(1, Math.min(90, Number.isFinite(parsedDays) ? parsedDays : 14));
    const now = new Date();
    const until = new Date(now.getTime() + days * 86400000);

    const memberships = await CohortMembership.find({ startupId: canonicalStartupId });
    const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);
    const upcoming = await Event.find({
      cohortId: { $in: cohortIds },
      startsAt: { $gte: now, $lte: until },
    })
      .sort({ startsAt: 1 })
      .limit(100)
      .lean();

    const agenda = upcoming.map((e) => mapToTimelineItem(e, "event", now));
    return apiSuccess(res, {
      events: upcoming,
      agenda: buildSortedTimeline(agenda),
      timeline: buildSortedTimeline(agenda),
    });
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
    const canonicalStartupId = await canAccessStartupForAgenda(req, req.params.startupId);
    if (!canonicalStartupId) {
      return apiError(res, "Forbidden.", 403);
    }

    const memberships = await CohortMembership.find({ startupId: canonicalStartupId });
    const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);

    const [eventCount, deliverableCount] = await Promise.all([
      Event.countDocuments({ cohortId: { $in: cohortIds } }),
      Deliverable.countDocuments({ cohortId: { $in: cohortIds } }),
    ]);

    return apiSuccess(res, {
      startupId: canonicalStartupId,
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
    if (!isSelfOrAdmin(req, req.params.userId)) {
      return apiError(res, "Forbidden.", 403);
    }

    const userId = req.params.userId;
    const { start, end } = parseCalendarWindow(req);
    const { events, deliverables, programMilestones, meetings, timeline } = await loadCalendarDataForUser(
      userId,
      start,
      end,
    );

    const windowed = filterTimelineByWindow(timeline, start, end);

    return apiSuccess(res, {
      events,
      deliverables,
      programMilestones,
      meetings,
      timeline: windowed,
      agenda: windowed,
      window: { start: start.toISOString(), end: end.toISOString() },
    });
  }),
);

export default agendaRouter;
