import { Router } from "express";
import { randomUUID } from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess, error as apiError } from "../utils/apiResponse.js";
import Meeting from "../models/Meeting.js";

const meetingsRouter = Router();

function toMeetingDto(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    id: String(obj._id),
    startupId: String(obj.startupId || ""),
    organizerId: String(obj.organizerId || ""),
    title: obj.title || "",
    description: obj.description || "",
    type: obj.type || "meeting",
    date: obj.date || "",
    startTime: obj.startTime || "",
    endTime: obj.endTime || "",
    location: obj.location || "",
    attendees: Array.isArray(obj.attendees) ? obj.attendees.map(String) : [],
    status: obj.status || "scheduled",
    isRecurring: Boolean(obj.isRecurring),
    recurrencePattern: obj.recurrencePattern || null,
    recurrenceEndType: obj.recurrenceEndType || null,
    recurrenceEndDate: obj.recurrenceEndDate || null,
    recurrenceOccurrences: obj.recurrenceOccurrences || null,
    weeklyDays: Array.isArray(obj.weeklyDays) ? obj.weeklyDays : [],
    recurrenceGroupId: obj.recurrenceGroupId || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function buildRecurringDates(base, pattern, weeklyDays, count) {
  const dates = [];
  const baseDate = new Date(base);

  if (pattern === "daily") {
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }
  } else if (pattern === "weekly") {
    const days = weeklyDays.length > 0 ? weeklyDays.sort() : [baseDate.getDay()];
    let added = 0;
    let weekOffset = 0;
    while (added < count) {
      for (const day of days) {
        if (added >= count) break;
        const d = new Date(baseDate);
        d.setDate(d.getDate() + weekOffset * 7 + ((day - baseDate.getDay() + 7) % 7));
        if (d >= baseDate || weekOffset > 0) {
          dates.push(formatDate(d));
          added++;
        }
      }
      weekOffset++;
      if (weekOffset > 200) break;
    }
  } else if (pattern === "monthly") {
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      dates.push(formatDate(d));
    }
  }

  return [...new Set(dates)].sort().slice(0, count);
}

function buildRecurringDatesUntil(base, pattern, weeklyDays, endDate) {
  const end = new Date(endDate);
  return buildRecurringDates(base, pattern, weeklyDays, 365).filter(
    (d) => new Date(d) <= end,
  );
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

meetingsRouter.post(
  "/meetings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      startupId,
      title,
      description,
      type,
      date,
      startTime,
      endTime,
      location,
      attendees,
      status,
      isRecurring,
      recurrencePattern,
      recurrenceEndType,
      recurrenceEndDate,
      recurrenceOccurrences,
      weeklyDays,
    } = req.body || {};

    if (!title || !date || !startTime || !endTime) {
      return apiError(res, "title, date, startTime, endTime are required.", 400);
    }

    const resolvedStartupId = startupId || req.user.id;
    const organizerId = req.user.id;

    if (!isRecurring) {
      const meeting = await Meeting.create({
        startupId: resolvedStartupId,
        organizerId,
        title,
        description: description || "",
        type: type || "meeting",
        date,
        startTime,
        endTime,
        location: location || "",
        attendees: Array.isArray(attendees) ? attendees : [],
        status: status || "scheduled",
        isRecurring: false,
      });
      return apiSuccess(res, { meeting: toMeetingDto(meeting), meetingCount: 1 }, 201);
    }

    const groupId = randomUUID();
    let dates = [];

    if (recurrenceEndType === "occurrences") {
      const count = Math.max(1, Math.min(365, parseInt(recurrenceOccurrences) || 10));
      dates = buildRecurringDates(date, recurrencePattern, weeklyDays || [], count);
    } else if (recurrenceEndType === "date" && recurrenceEndDate) {
      dates = buildRecurringDatesUntil(date, recurrencePattern, weeklyDays || [], recurrenceEndDate);
    } else {
      dates = buildRecurringDates(date, recurrencePattern, weeklyDays || [], 10);
    }

    if (dates.length === 0) dates = [date];

    const docs = dates.map((d) => ({
      startupId: resolvedStartupId,
      organizerId,
      title,
      description: description || "",
      type: type || "meeting",
      date: d,
      startTime,
      endTime,
      location: location || "",
      attendees: Array.isArray(attendees) ? attendees : [],
      status: status || "scheduled",
      isRecurring: true,
      recurrencePattern,
      recurrenceEndType,
      recurrenceEndDate: recurrenceEndType === "date" ? recurrenceEndDate : null,
      recurrenceOccurrences: recurrenceEndType === "occurrences" ? parseInt(recurrenceOccurrences) : null,
      weeklyDays: weeklyDays || [],
      recurrenceGroupId: groupId,
    }));

    const meetings = await Meeting.insertMany(docs);
    return apiSuccess(res, {
      meeting: toMeetingDto(meetings[0]),
      meetingCount: meetings.length,
    }, 201);
  }),
);

meetingsRouter.get(
  "/meetings/startup/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startupId } = req.params;
    const meetings = await Meeting.find({ startupId, status: { $ne: "cancelled" } })
      .sort({ date: 1, startTime: 1 })
      .lean();
    return apiSuccess(res, { meetings: meetings.map(toMeetingDto) });
  }),
);

meetingsRouter.get(
  "/meetings/user/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const meetings = await Meeting.find({
      $or: [{ organizerId: userId }, { attendees: userId }],
      status: { $ne: "cancelled" },
    })
      .sort({ date: 1, startTime: 1 })
      .lean();
    return apiSuccess(res, { meetings: meetings.map(toMeetingDto) });
  }),
);

meetingsRouter.put(
  "/meetings/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return apiError(res, "Meeting not found.", 404);
    if (String(meeting.organizerId) !== req.user.id && !req.user.isAdmin) {
      return apiError(res, "Forbidden.", 403);
    }
    const allowed = ["title", "description", "type", "date", "startTime", "endTime", "location", "attendees", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) meeting[key] = req.body[key];
    }
    await meeting.save();
    return apiSuccess(res, { meeting: toMeetingDto(meeting) });
  }),
);

meetingsRouter.delete(
  "/meetings/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return apiError(res, "Meeting not found.", 404);
    if (String(meeting.organizerId) !== req.user.id && !req.user.isAdmin) {
      return apiError(res, "Forbidden.", 403);
    }
    await meeting.deleteOne();
    return apiSuccess(res, { deleted: true });
  }),
);

export default meetingsRouter;
