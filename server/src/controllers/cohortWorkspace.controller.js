import { randomUUID } from "node:crypto";
import Event from "../models/Event.js";
import Announcement from "../models/Announcement.js";
import Resource from "../models/Resource.js";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import ProgramMilestone from "../models/ProgramMilestone.js";
import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import Task from "../models/Task.js";
import Milestone from "../models/Milestone.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { broadcastNotification } from "../services/notificationService.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { organizationRoom } from "../realtime/rooms.js";

function mapEvent(e) {
  const o = e.toObject ? e.toObject() : e;
  return {
    ...o,
    id: String(o._id),
    startTime: o.startsAt,
    endTime: o.endsAt,
  };
}

function mapResource(r) {
  const o = r.toObject ? r.toObject() : r;
  return { ...o, id: String(o._id) };
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

const ANNOUNCEMENT_PRIORITIES = ["low", "normal", "high", "urgent"];
const ANNOUNCEMENT_CATEGORIES = ["general", "wall-of-wins", "team-events"];
const EVENT_TYPES = [
  "workshop",
  "demo-day",
  "office-hours",
  "networking",
  "standup",
  "other",
];
const RESOURCE_CATEGORIES = [
  "general",
  "template",
  "guide",
  "video",
  "tool",
  "article",
];
const RESOURCE_TYPES = [
  "link",
  "document",
  "video",
  "article",
  "tool",
  "template",
  "other",
];

function coerceEnum(value, allowed, fallback) {
  return typeof value === "string" && allowed.includes(value)
    ? value
    : fallback;
}

function toFiniteNumberOrNull(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Server-side default for virtual-event meeting URLs. Centralised here so
 * create and update share the same source of truth - the client no longer
 * fabricates these.
 */
function defaultVirtualMeetingUrl() {
  const base =
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "";
  const room = `Event-${randomUUID().slice(0, 8)}`;
  return base ? `${base.replace(/\/$/, "")}/join/${room}` : `/join/${room}`;
}

/**
 * Translates a request body into a partial Event document. When `isUpdate` is
 * true, undefined fields are skipped so callers can do partial PUTs.
 */
function coerceEventPayload(body, { isUpdate = false } = {}) {
  const out = {};
  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;

  if (!isUpdate || has("title")) out.title = body.title || "Event";
  if (!isUpdate || has("description")) out.description = body.description || "";
  if (!isUpdate || has("startsAt") || has("startTime")) {
    out.startsAt = body.startsAt || body.startTime || (isUpdate ? undefined : new Date());
  }
  if (!isUpdate || has("endsAt") || has("endTime")) {
    out.endsAt = body.endsAt ?? body.endTime ?? null;
  }
  if (!isUpdate || has("location")) out.location = body.location || "";
  if (!isUpdate || has("attendees")) out.attendees = Array.isArray(body.attendees) ? body.attendees : [];
  if (!isUpdate || has("eventType")) {
    out.eventType = coerceEnum(body.eventType, EVENT_TYPES, "other");
  }
  if (!isUpdate || has("isVirtual")) out.isVirtual = Boolean(body.isVirtual);
  if (!isUpdate || has("meetingUrl")) {
    out.meetingUrl = typeof body.meetingUrl === "string" ? body.meetingUrl : "";
  }
  if (!isUpdate || has("capacity")) {
    out.capacity = toFiniteNumberOrNull(body.capacity);
  }
  return out;
}

function coerceResourcePayload(body, { isUpdate = false } = {}) {
  const out = {};
  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;

  if (!isUpdate || has("title")) out.title = body.title || "Resource";
  if (!isUpdate || has("description")) out.description = body.description || "";
  if (!isUpdate || has("category")) {
    out.category = coerceEnum(body.category, RESOURCE_CATEGORIES, "general");
  }
  if (!isUpdate || has("type")) {
    out.type = coerceEnum(body.type, RESOURCE_TYPES, "other");
  }
  if (!isUpdate || has("url")) out.url = typeof body.url === "string" ? body.url : "";
  if (!isUpdate || has("tags")) out.tags = normalizeTags(body.tags);
  return out;
}

export const listCohortEvents = async (req, res) => {
  const rows = await Event.find({ cohortId: req.params.cohortId }).sort({ startsAt: 1 });
  return apiSuccess(res, { events: rows.map(mapEvent) });
};

export const createCohortEvent = async (req, res) => {
  const body = req.body || {};
  const coerced = coerceEventPayload(body, { isUpdate: false });

  if (coerced.isVirtual && !coerced.meetingUrl) {
    coerced.meetingUrl = defaultVirtualMeetingUrl();
  }

  const event = await Event.create({
    cohortId: req.params.cohortId || body.cohortId,
    founderId: body.founderId || null,
    organizationId: body.organizationId || null,
    ...coerced,
    createdBy: body.createdBy || req.user?.id || null,
  });
  return apiSuccess(res, { event: mapEvent(event) }, 201);
};

/** PUT /cohorts/:cohortId/events/:eventId */
export const updateCohortEvent = async (req, res) => {
  const { cohortId, eventId } = req.params;
  const event = await Event.findById(eventId);
  if (!event) {
    return apiError(res, "Event not found.", 404);
  }
  if (String(event.cohortId) !== String(cohortId)) {
    return apiError(res, "Event does not belong to this cohort.", 403);
  }

  const patch = coerceEventPayload(req.body || {}, { isUpdate: true });
  Object.assign(event, patch);

  // If the event is now virtual without a meeting URL, fill the default.
  if (event.isVirtual && !event.meetingUrl) {
    event.meetingUrl = defaultVirtualMeetingUrl();
  }

  await event.save();

  const dto = mapEvent(event);
  const orgId = event.organizationId ? String(event.organizationId) : null;
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.EVENT_UPDATED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, { event: dto });
};

/** DELETE /cohorts/:cohortId/events/:eventId */
export const deleteCohortEvent = async (req, res) => {
  const { cohortId, eventId } = req.params;
  const event = await Event.findById(eventId);
  if (!event) {
    return apiError(res, "Event not found.", 404);
  }
  if (String(event.cohortId) !== String(cohortId)) {
    return apiError(res, "Event does not belong to this cohort.", 403);
  }

  const dto = mapEvent(event);
  const orgId = event.organizationId ? String(event.organizationId) : null;
  const rooms = orgId ? [organizationRoom(orgId)] : [];

  // "Late cancellation" - emit a separate cancellation signal so clients can
  // surface a notice in addition to removing the card from the list.
  const startsAtMs = event.startsAt ? new Date(event.startsAt).getTime() : 0;
  const isImminent = startsAtMs > 0 && startsAtMs - Date.now() < 24 * 3600 * 1000;
  if (isImminent && rooms.length) {
    emitRealtime(SOCKET_EVENTS.EVENT_CANCELLED, dto, rooms);
  }

  await Event.findByIdAndDelete(eventId);

  if (rooms.length) {
    emitRealtime(
      SOCKET_EVENTS.EVENT_DELETED,
      { id: dto.id, cohortId: String(cohortId), organizationId: orgId },
      rooms,
    );
  }
  return apiSuccess(res, { deleted: true, id: dto.id });
};

export const listCohortAnnouncements = async (req, res) => {
  const rows = await Announcement.find({ cohortId: req.params.cohortId }).sort({ createdAt: -1 });
  return apiSuccess(res, {
    announcements: rows.map((a) => {
      const o = a.toObject();
      return { ...o, id: String(o._id) };
    }),
  });
};

export const createCohortAnnouncement = async (req, res) => {
  const body = req.body || {};
  const cohortId = req.params.cohortId || body.cohortId;
  const announcement = await Announcement.create({
    cohortId,
    founderId: body.founderId || null,
    organizationId: body.organizationId || null,
    title: body.title || "Announcement",
    body: body.body || body.message || "",
    priority: coerceEnum(body.priority, ANNOUNCEMENT_PRIORITIES, "normal"),
    category: coerceEnum(body.category, ANNOUNCEMENT_CATEGORIES, "general"),
    emoji: typeof body.emoji === "string" ? body.emoji : "",
    createdBy:
      typeof body.createdBy === "string" && body.createdBy.trim()
        ? body.createdBy.trim()
        : String(req.user?.id || body.founderId || ""),
    createdByName:
      typeof body.createdByName === "string" && body.createdByName.trim()
        ? body.createdByName.trim()
        : String(req.user?.name || req.user?.email || ""),
  });

  // Notify every founder in the cohort.
  try {
    const memberships = await CohortMembership.find({ cohortId }, { founderId: 1 }).lean();
    const recipients = memberships.map((m) => m.founderId).filter(Boolean);
    if (recipients.length) {
      await broadcastNotification(recipients, {
        type: "cohort-announcement",
        title: announcement.title || "Cohort announcement",
        message: announcement.body || "",
        actionUrl: `/?view=virtual-office&tab=announcements&cohortId=${cohortId}`,
        metadata: {
          announcementId: String(announcement._id),
          cohortId: String(cohortId),
        },
      });
    }
  } catch (err) {
    console.error("[createCohortAnnouncement] notify failed:", err.message);
  }

  const o = announcement.toObject();
  return apiSuccess(res, { announcement: { ...o, id: String(o._id) } }, 201);
};

export const listCohortResources = async (req, res) => {
  const rows = await Resource.find({ cohortId: req.params.cohortId }).sort({
    createdAt: -1,
  });
  return apiSuccess(res, { resources: rows.map(mapResource) });
};

export const createCohortResource = async (req, res) => {
  const body = req.body || {};
  const coerced = coerceResourcePayload(body, { isUpdate: false });
  const resource = await Resource.create({
    cohortId: req.params.cohortId || body.cohortId,
    founderId: body.founderId || null,
    ...coerced,
    createdBy: body.createdBy || req.user?.id || null,
  });
  return apiSuccess(res, { resource: mapResource(resource) }, 201);
};

/** PUT /cohorts/:cohortId/resources/:resourceId */
export const updateCohortResource = async (req, res) => {
  const { cohortId, resourceId } = req.params;
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return apiError(res, "Resource not found.", 404);
  }
  if (String(resource.cohortId) !== String(cohortId)) {
    return apiError(res, "Resource does not belong to this cohort.", 403);
  }

  const patch = coerceResourcePayload(req.body || {}, { isUpdate: true });
  Object.assign(resource, patch);
  await resource.save();

  const dto = mapResource(resource);
  const cohortOrg = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("organizationId")
    .lean();
  const orgId = cohortOrg?.organizationId ? String(cohortOrg.organizationId) : null;
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.RESOURCE_UPDATED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, { resource: dto });
};

/** DELETE /cohorts/:cohortId/resources/:resourceId */
export const deleteCohortResource = async (req, res) => {
  const { cohortId, resourceId } = req.params;
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return apiError(res, "Resource not found.", 404);
  }
  if (String(resource.cohortId) !== String(cohortId)) {
    return apiError(res, "Resource does not belong to this cohort.", 403);
  }

  const id = String(resource._id);
  await Resource.findByIdAndDelete(resourceId);

  const cohortOrg = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("organizationId")
    .lean();
  const orgId = cohortOrg?.organizationId ? String(cohortOrg.organizationId) : null;
  if (orgId) {
    emitRealtime(
      SOCKET_EVENTS.RESOURCE_DELETED,
      { id, cohortId: String(cohortId), organizationId: orgId },
      [organizationRoom(orgId)],
    );
  }
  return apiSuccess(res, { deleted: true, id });
};

export const getCohortAnalyticsOverview = async (req, res) => {
  const cohortId = req.params.cohortId;
  const members = await CohortMembership.find({ cohortId }).lean();
  const activeMembers = members.filter(
    (m) => !m.status || m.status === "active",
  );
  const founderIds = activeMembers.map((m) => m.founderId).filter(Boolean);
  const startupIds = activeMembers.map((m) => m.startupId).filter(Boolean);
  const cohortSize = activeMembers.length;
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const recentJoins = activeMembers.filter(
    (m) => m.joinedAt && new Date(m.joinedAt).getTime() >= thirtyDaysAgo,
  ).length;

  const [
    totalTeamMembers,
    totalWeeklyOutcomes,
    totalTasks,
    completedTasks,
    totalMilestones,
    completedMilestones,
    totalProgramMilestones,
    totalDeliverables,
  ] = await Promise.all([
    TeamMemberProfile.countDocuments({ startupId: { $in: startupIds } }),
    WeeklyOutcome.countDocuments({ founderId: { $in: founderIds } }),
    Task.countDocuments({ startupId: { $in: startupIds } }),
    Task.countDocuments({ startupId: { $in: startupIds }, status: "completed" }),
    Milestone.countDocuments({ founderId: { $in: founderIds } }),
    Milestone.countDocuments({ founderId: { $in: founderIds }, status: "completed" }),
    ProgramMilestone.countDocuments({ cohortId }),
    Deliverable.countDocuments({ cohortId }),
  ]);

  const deliverableDocs = await Deliverable.find({ cohortId }).select("_id");
  const deliverableIds = deliverableDocs.map((d) => d._id);
  const totalSubmissions =
    deliverableIds.length === 0
      ? 0
      : await DeliverableSubmission.countDocuments({ deliverableId: { $in: deliverableIds } });

  const taskCompletionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const milestoneCompletionRate =
    totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);
  const expectedSubs = totalDeliverables * Math.max(cohortSize, 1);
  const submissionRate =
    expectedSubs === 0 ? 0 : Math.min(100, Math.round((totalSubmissions / expectedSubs) * 100));

  const analytics = {
    cohortSize,
    recentJoinsLast30Days: recentJoins,
    aggregateMetrics: {
      totalTeamMembers,
      avgTeamSize: cohortSize === 0 ? 0 : Math.round((totalTeamMembers / cohortSize) * 10) / 10,
      totalWeeklyOutcomes,
      avgWeeklyOutcomesPerStartup:
        cohortSize === 0 ? 0 : Math.round((totalWeeklyOutcomes / cohortSize) * 10) / 10,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      totalMilestones,
      completedMilestones,
      milestoneCompletionRate,
    },
    programMetrics: {
      totalProgramMilestones,
      totalDeliverables,
      totalSubmissions,
      submissionRate,
    },
  };

  return apiSuccess(res, { analytics });
};

const defaultFactors = () => ({
  weeklyExecution: 15,
  taskCompletion: 12,
  teamActivity: 15,
  milestoneProgress: 10,
});

export const getCohortPortfolioHealth = async (req, res) => {
  const cohortId = req.params.cohortId;
  const members = await CohortMembership.find({ cohortId }).lean();
  const founderIds = members.map((m) => m.founderId).filter(Boolean);

  const startups = await Startup.find({ founderId: { $in: founderIds } }).lean();
  const users = await User.find({ _id: { $in: founderIds } }).lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const portfolio = [];
  for (const founderId of founderIds) {
    const fid = String(founderId);
    const startup = startups.find((s) => String(s.founderId) === fid);
    const user = userById.get(fid);
    const total = await Task.countDocuments({ founderId });
    const completed = await Task.countDocuments({ founderId, status: "completed" });
    const score = total === 0 ? 50 : Math.round((completed / total) * 100);
    let status = "healthy";
    if (score < 40) status = "critical";
    else if (score < 70) status = "warning";

    portfolio.push({
      founderId: fid,
      startupName: startup?.name || "Unnamed Startup",
      founderName: user?.name || user?.email || "Founder",
      health: {
        status,
        score,
        factors: defaultFactors(),
      },
    });
  }

  const healthy = portfolio.filter((p) => p.health.status === "healthy").length;
  const warning = portfolio.filter((p) => p.health.status === "warning").length;
  const critical = portfolio.filter((p) => p.health.status === "critical").length;
  const avgScore =
    portfolio.length === 0
      ? 0
      : Math.round(portfolio.reduce((s, p) => s + p.health.score, 0) / portfolio.length);

  const cohortStats = {
    total: portfolio.length,
    healthy,
    warning,
    critical,
    avgScore,
  };

  return apiSuccess(res, { portfolio, cohortStats });
};
