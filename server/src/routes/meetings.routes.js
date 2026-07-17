import { Router } from "express";
import { randomUUID } from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess, error as apiError } from "../utils/apiResponse.js";
import Meeting from "../models/Meeting.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import { broadcastNotification } from "../services/notificationService.js";
import { officeDeepLink } from "../utils/deepLinks.js";

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

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

/**
 * Resolve a client "startup scope" (founder user id or Startup._id) into
 * { founderId, startupDocId, scopeIds } for ACL + queries.
 * Meetings are historically keyed by founder user id (client getStartupId).
 */
async function resolveMeetingScope(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return null;

  const byId = await Startup.findById(value, { _id: 1, founderId: 1 }).lean();
  if (byId?._id && byId.founderId) {
    const founderId = String(byId.founderId);
    const startupDocId = String(byId._id);
    return {
      founderId,
      startupDocId,
      // Query both keys so legacy founder-id storage and canonical Startup._id both work
      scopeIds: [...new Set([founderId, startupDocId])],
    };
  }

  const byFounder = await Startup.findOne(
    { founderId: value },
    { _id: 1, founderId: 1 },
  ).lean();
  if (byFounder?._id) {
    const founderId = String(byFounder.founderId || value);
    const startupDocId = String(byFounder._id);
    return {
      founderId,
      startupDocId,
      scopeIds: [...new Set([founderId, startupDocId, value])],
    };
  }

  // Founder with no Startup doc yet — still allow founder-scoped meetings
  return {
    founderId: value,
    startupDocId: value,
    scopeIds: [value],
  };
}

async function canAccessMeetingScope(req, rawStartupId) {
  const scope = await resolveMeetingScope(rawStartupId);
  if (!scope) return null;
  if (req.user?.isAdmin) return scope;

  const me = await User.findById(req.user.id, {
    startupId: 1,
    founderId: 1,
    role: 1,
  }).lean();
  if (!me) return null;

  if (String(req.user.id) === scope.founderId) return scope;

  const myStartup = String(me.startupId || "");
  const myFounder = String(me.founderId || "");
  if (
    myFounder === scope.founderId ||
    (myStartup && scope.scopeIds.includes(myStartup))
  ) {
    return scope;
  }
  return null;
}

async function isFounderOfScope(req, scope) {
  if (!scope) return false;
  if (req.user?.isAdmin) return true;
  return String(req.user.id) === scope.founderId;
}

async function listTeamMemberUserIds(scope) {
  const founderId = scope.founderId;
  const startupId = scope.startupDocId;
  const profileQuery =
    startupId && startupId !== founderId
      ? { $or: [{ founderId }, { startupId }] }
      : { founderId };
  const profiles = await TeamMemberProfile.find(profileQuery)
    .select("userId")
    .lean();
  const profileUserIds = profiles.map((p) => p.userId).filter(Boolean);

  const userQuery =
    startupId && startupId !== founderId
      ? {
          $or: [
            { founderId, role: { $in: ["team-member", "team"] } },
            { startupId, role: { $in: ["team-member", "team"] } },
            { _id: { $in: profileUserIds } },
          ],
        }
      : {
          $or: [
            { founderId, role: { $in: ["team-member", "team"] } },
            { _id: { $in: profileUserIds } },
          ],
        };

  const members = await User.find(userQuery, { _id: 1 }).lean();
  return [
    ...new Set([
      founderId,
      ...members.map((m) => String(m._id)),
      ...profileUserIds.map(String),
    ]),
  ].filter(Boolean);
}

async function notifyTeamOfMeeting({
  scope,
  organizerId,
  meeting,
  meetingCount = 1,
}) {
  try {
    const attendeeIds = Array.isArray(meeting?.attendees)
      ? meeting.attendees.map(String).filter(Boolean)
      : [];
    // Honor scheduler attendee checks; fall back to full team when empty.
    const teamIds =
      attendeeIds.length > 0
        ? attendeeIds
        : await listTeamMemberUserIds(scope);
    const recipients = teamIds.filter(
      (id) => id && String(id) !== String(organizerId),
    );
    if (!recipients.length) return;

    const title = meeting?.title || "New meeting";
    const when = [meeting?.date, meeting?.startTime, meeting?.endTime]
      .filter(Boolean)
      .join(" ");
    const recurringNote =
      meetingCount > 1 || meeting?.isRecurring
        ? ` (${meetingCount > 1 ? `${meetingCount} occurrences` : "recurring"})`
        : "";
    const message = when
      ? `"${title}" is scheduled for ${when}${recurringNote}.`
      : `"${title}" was scheduled${recurringNote}.`;

    await broadcastNotification(recipients, {
      type: "meeting-scheduled",
      title: "New meeting scheduled",
      message,
      actionUrl: officeDeepLink({ tab: "calendar" }),
      metadata: {
        meetingId: String(meeting?.id || meeting?._id || ""),
        startupId: String(meeting?.startupId || scope.founderId || ""),
        date: meeting?.date || "",
        startTime: meeting?.startTime || "",
        endTime: meeting?.endTime || "",
        isRecurring: Boolean(meeting?.isRecurring),
        meetingCount,
      },
    });
  } catch (err) {
    // Fan-out must not block the create response.
    console.error("[meetings] notify team failed:", err.message);
  }
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

    const requestedScope = startupId || req.user.id;
    const scope = await canAccessMeetingScope(req, requestedScope);
    if (!scope) {
      return apiError(res, "Forbidden.", 403);
    }
    if (!(await isFounderOfScope(req, scope))) {
      return apiError(res, "Only the founder can schedule meetings.", 403);
    }

    const organizerId = req.user.id;
    // Persist under founder id (matches client getStartupId bucket)
    const storageStartupId = scope.founderId;

    let resolvedAttendees = Array.isArray(attendees)
      ? attendees.map(String).filter(Boolean)
      : [];
    if (resolvedAttendees.length === 0) {
      resolvedAttendees = await listTeamMemberUserIds(scope);
    } else if (!resolvedAttendees.includes(String(organizerId))) {
      resolvedAttendees = [...resolvedAttendees, String(organizerId)];
    }

    if (!isRecurring) {
      const meeting = await Meeting.create({
        startupId: storageStartupId,
        organizerId,
        title,
        description: description || "",
        type: type || "meeting",
        date,
        startTime,
        endTime,
        location: location || "",
        attendees: resolvedAttendees,
        status: status || "scheduled",
        isRecurring: false,
      });
      const dto = toMeetingDto(meeting);
      await notifyTeamOfMeeting({
        scope,
        organizerId,
        meeting: dto,
        meetingCount: 1,
      });
      return apiSuccess(res, { meeting: dto, meetingCount: 1 }, 201);
    }

    const groupId = randomUUID();
    let dates = [];

    if (recurrenceEndType === "occurrences") {
      const count = Math.max(
        1,
        Math.min(365, parseInt(recurrenceOccurrences, 10) || 10),
      );
      dates = buildRecurringDates(
        date,
        recurrencePattern,
        weeklyDays || [],
        count,
      );
    } else if (recurrenceEndType === "date" && recurrenceEndDate) {
      dates = buildRecurringDatesUntil(
        date,
        recurrencePattern,
        weeklyDays || [],
        recurrenceEndDate,
      );
    } else {
      dates = buildRecurringDates(date, recurrencePattern, weeklyDays || [], 10);
    }

    if (dates.length === 0) dates = [date];

    const docs = dates.map((d) => ({
      startupId: storageStartupId,
      organizerId,
      title,
      description: description || "",
      type: type || "meeting",
      date: d,
      startTime,
      endTime,
      location: location || "",
      attendees: resolvedAttendees,
      status: status || "scheduled",
      isRecurring: true,
      recurrencePattern,
      recurrenceEndType,
      recurrenceEndDate:
        recurrenceEndType === "date" ? recurrenceEndDate : null,
      recurrenceOccurrences:
        recurrenceEndType === "occurrences"
          ? parseInt(recurrenceOccurrences, 10)
          : null,
      weeklyDays: weeklyDays || [],
      recurrenceGroupId: groupId,
    }));

    const meetings = await Meeting.insertMany(docs);
    const dto = toMeetingDto(meetings[0]);
    await notifyTeamOfMeeting({
      scope,
      organizerId,
      meeting: dto,
      meetingCount: meetings.length,
    });
    return apiSuccess(
      res,
      {
        meeting: dto,
        meetingCount: meetings.length,
      },
      201,
    );
  }),
);

meetingsRouter.get(
  "/meetings/startup/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = await canAccessMeetingScope(req, req.params.startupId);
    if (!scope) {
      return apiError(res, "Forbidden.", 403);
    }
    const meetings = await Meeting.find({
      startupId: { $in: scope.scopeIds },
      status: { $ne: "cancelled" },
    })
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
    const isSelf =
      req.user?.isAdmin === true || String(req.user.id) === String(userId);
    if (!isSelf) {
      return apiError(res, "Forbidden.", 403);
    }
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
    const allowed = [
      "title",
      "description",
      "type",
      "date",
      "startTime",
      "endTime",
      "location",
      "attendees",
      "status",
    ];
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
