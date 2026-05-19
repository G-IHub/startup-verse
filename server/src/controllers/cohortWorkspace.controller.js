import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
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
import {
  parseListQuery,
  paginatedSuccess,
  listDocumentsWithSearch,
} from "../utils/listQuery.js";
import { publicAppUrl } from "../utils/publicAppUrl.js";
import { broadcastNotification } from "../services/notificationService.js";
import { emitRealtime } from "../services/realtime.service.js";
import { emitToOrganization } from "../realtime/emitOrg.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { organizationRoom } from "../realtime/rooms.js";
import { logger } from "../config/logger.js";
import { loadPortfolioHealthAggregates } from "../utils/loadPortfolioHealthAggregates.js";
import { buildPortfolioRow } from "../utils/portfolioHealthScoring.js";
import { parseAnalyticsRange } from "../utils/parseAnalyticsRange.js";
import { loadCohortAnalyticsTrends } from "../utils/cohortAnalyticsTrends.js";
import { computeCohortBadgeCounts } from "../utils/cohortBadgeCounts.js";
import {
  loadCohortMembersForExport,
  EXPORT_MAX_MEMBERS,
} from "../utils/cohortMemberAggregation.js";
import {
  buildCohortExportDocument,
  exportRowsToCsv,
  sanitizeExportFilename,
} from "../utils/cohortExport.js";
import Organization from "../models/Organization.js";

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

function mapAnnouncement(a) {
  const o = a.toObject ? a.toObject() : a;
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
  const base = publicAppUrl();
  const room = `Event-${randomUUID().slice(0, 8)}`;
  return base ? `${base}/join/${room}` : `/join/${room}`;
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

function coerceAnnouncementPayload(body, { isUpdate = false } = {}) {
  const out = {};
  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;

  if (!isUpdate || has("title")) out.title = body.title || "Announcement";
  if (!isUpdate || has("body") || has("message")) {
    out.body = body.body || body.message || "";
  }
  if (!isUpdate || has("priority")) {
    out.priority = coerceEnum(body.priority, ANNOUNCEMENT_PRIORITIES, "normal");
  }
  if (!isUpdate || has("category")) {
    out.category = coerceEnum(body.category, ANNOUNCEMENT_CATEGORIES, "general");
  }
  if (!isUpdate || has("emoji")) {
    out.emoji = typeof body.emoji === "string" ? body.emoji : "";
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
  const listOptions = parseListQuery(req, {
    defaultSortBy: "startsAt",
    allowedSortFields: ["startsAt", "endsAt", "createdAt", "title"],
    defaultSortOrder: "asc",
    extraFilterKeys: ["eventType"],
  });
  const baseFilter = { cohortId: req.params.cohortId };
  if (listOptions.extraFilters.eventType) {
    baseFilter.eventType = listOptions.extraFilters.eventType;
  }
  const { items, total } = await listDocumentsWithSearch(Event, {
    baseFilter,
    listOptions,
    textSearch: true,
    regexFields: ["title", "description"],
    mapRow: mapEvent,
  });
  return paginatedSuccess(res, items, total, listOptions);
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

  // Step 2.12 — fire-and-forget broadcast to active cohort members. Failures
  // must not block the API response.
  const cohortIdForBroadcast = event.cohortId ? String(event.cohortId) : null;
  if (cohortIdForBroadcast) {
    Promise.resolve()
      .then(async () => {
        const memberships = await CohortMembership.find(
          { cohortId: cohortIdForBroadcast, status: "active" },
          { founderId: 1 },
        ).lean();
        const founderIds = memberships
          .map((m) => m.founderId)
          .filter(Boolean)
          .map(String);
        if (!founderIds.length) return null;
        const startTimeIso = event.startsAt
          ? new Date(event.startsAt).toISOString()
          : "";
        return broadcastNotification(founderIds, {
          type: "cohort-event-created",
          title: `New event: ${event.title}`,
          message: `${event.eventType || "Event"}${startTimeIso ? ` scheduled for ${startTimeIso}` : ""}`,
          actionUrl: `/dashboard?view=calendar&event=${event._id}`,
          metadata: {
            eventId: String(event._id),
            cohortId: cohortIdForBroadcast,
            eventType: event.eventType || "",
            startTime: event.startsAt,
            isVirtual: Boolean(event.isVirtual),
          },
        });
      })
      .catch((err) =>
        logger.warn("event.notify_failed", {
          eventId: String(event._id),
          error: String(err?.message || err),
        }),
      );
  }

  const dto = mapEvent(event);
  const orgId = cohortIdForBroadcast
    ? await resolveCohortOrgId(event, cohortIdForBroadcast)
    : event.organizationId
      ? String(event.organizationId)
      : null;
  if (orgId) {
    emitToOrganization(orgId, SOCKET_EVENTS.EVENT_CREATED, {
      ...dto,
      cohortId: cohortIdForBroadcast,
    });
  }

  return apiSuccess(res, { event: dto }, 201);
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
  const listOptions = parseListQuery(req, {
    allowedSortFields: ["createdAt", "title", "priority"],
  });
  const baseFilter = { cohortId: req.params.cohortId };
  if (listOptions.status) {
    baseFilter.priority = listOptions.status;
  }
  const { items, total } = await listDocumentsWithSearch(Announcement, {
    baseFilter,
    listOptions,
    textSearch: true,
    regexFields: ["title", "body"],
    mapRow: mapAnnouncement,
  });
  return paginatedSuccess(res, items, total, listOptions);
};

export const createCohortAnnouncement = async (req, res) => {
  const body = req.body || {};
  const cohortId = req.params.cohortId || body.cohortId;
  const coerced = coerceAnnouncementPayload(body, { isUpdate: false });
  const announcement = await Announcement.create({
    cohortId,
    founderId: body.founderId || null,
    organizationId: body.organizationId || null,
    ...coerced,
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

  const dto = mapAnnouncement(announcement);
  const orgId = await resolveCohortOrgId(announcement, cohortId);
  if (orgId) {
    emitToOrganization(orgId, SOCKET_EVENTS.ANNOUNCEMENT_CREATED, {
      ...dto,
      cohortId: String(cohortId),
    });
  }

  return apiSuccess(res, { announcement: dto }, 201);
};

async function resolveCohortOrgId(announcement, cohortId) {
  if (announcement.organizationId) return String(announcement.organizationId);
  const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("organizationId")
    .lean();
  return cohort?.organizationId ? String(cohort.organizationId) : null;
}

/** PUT /cohorts/:cohortId/announcements/:announcementId */
export const updateCohortAnnouncement = async (req, res) => {
  const { cohortId, announcementId } = req.params;
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    return apiError(res, "Announcement not found.", 404);
  }
  if (String(announcement.cohortId) !== String(cohortId)) {
    return apiError(res, "Announcement does not belong to this cohort.", 403);
  }

  const patch = coerceAnnouncementPayload(req.body || {}, { isUpdate: true });
  Object.assign(announcement, patch);
  await announcement.save();

  const dto = mapAnnouncement(announcement);
  const orgId = await resolveCohortOrgId(announcement, cohortId);
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.ANNOUNCEMENT_UPDATED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, { announcement: dto });
};

/** DELETE /cohorts/:cohortId/announcements/:announcementId */
export const deleteCohortAnnouncement = async (req, res) => {
  const { cohortId, announcementId } = req.params;
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    return apiError(res, "Announcement not found.", 404);
  }
  if (String(announcement.cohortId) !== String(cohortId)) {
    return apiError(res, "Announcement does not belong to this cohort.", 403);
  }

  const id = String(announcement._id);
  const orgId = await resolveCohortOrgId(announcement, cohortId);
  await Announcement.findByIdAndDelete(announcementId);

  if (orgId) {
    emitRealtime(
      SOCKET_EVENTS.ANNOUNCEMENT_DELETED,
      { id, cohortId: String(cohortId), organizationId: orgId },
      [organizationRoom(orgId)],
    );
  }
  return apiSuccess(res, { deleted: true, id });
};

/** POST /cohorts/:cohortId/announcements/:announcementId/read */
export const markAnnouncementRead = async (req, res) => {
  const { cohortId, announcementId } = req.params;
  const userId = String(req.user?.id || "");
  if (!userId) {
    return apiError(res, "Authentication required.", 401);
  }

  const result = await Announcement.updateOne(
    { _id: announcementId, cohortId },
    { $addToSet: { readBy: userId } },
  );
  if (!result.matchedCount) {
    return apiError(res, "Announcement not found.", 404);
  }

  const fresh = await Announcement.findById(announcementId)
    .select("organizationId readBy")
    .lean();
  const readCount = Array.isArray(fresh?.readBy) ? fresh.readBy.length : 0;
  const orgId = fresh?.organizationId
    ? String(fresh.organizationId)
    : await resolveCohortOrgId({ organizationId: null }, cohortId);

  if (orgId) {
    emitRealtime(
      SOCKET_EVENTS.ANNOUNCEMENT_READ,
      {
        id: String(announcementId),
        cohortId: String(cohortId),
        organizationId: orgId,
        userId,
        readCount,
      },
      [organizationRoom(orgId)],
    );
  }
  return apiSuccess(res, { marked: true, id: String(announcementId), readCount });
};

/** GET /cohorts/:cohortId/badge-counts — org-admin sidebar badges (Step 2.1). */
export const getCohortBadgeCounts = async (req, res) => {
  const cohortId = req.params.cohortId;
  if (!mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return apiError(res, "Invalid cohortId.", 400);
  }

  const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("_id")
    .lean();
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }

  const counts = await computeCohortBadgeCounts(cohortId, req.user.id);
  return apiSuccess(res, counts);
};

/** GET /cohorts/:cohortId/export — org-admin cohort CSV/JSON export (Step 4.1). */
export const getCohortExport = async (req, res) => {
  const cohortId = req.params.cohortId;
  if (!mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return apiError(res, "Invalid cohortId.", 400);
  }

  const formatRaw = String(req.query?.format || "csv").trim().toLowerCase();
  if (formatRaw !== "csv" && formatRaw !== "json") {
    return apiError(res, "format must be csv or json.", 400);
  }

  const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null }).lean();
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }

  const org = cohort.organizationId
    ? await Organization.findById(cohort.organizationId).select("name").lean()
    : null;

  const { items, total } = await loadCohortMembersForExport(cohortId);
  const document = buildCohortExportDocument({
    cohort,
    organizationName: org?.name || "",
    members: items,
  });

  if (total > EXPORT_MAX_MEMBERS) {
    res.setHeader("X-Export-Truncated", "true");
  }

  if (formatRaw === "json") {
    return apiSuccess(res, document);
  }

  const csv = exportRowsToCsv(document.startups);
  const filename = `${sanitizeExportFilename(cohort.name)}-export.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(csv);
};

export const listCohortResources = async (req, res) => {
  const listOptions = parseListQuery(req, {
    allowedSortFields: ["createdAt", "title", "category", "type"],
    extraFilterKeys: ["category", "type"],
  });
  const baseFilter = { cohortId: req.params.cohortId };
  if (listOptions.extraFilters.category) {
    baseFilter.category = listOptions.extraFilters.category;
  }
  if (listOptions.extraFilters.type) {
    baseFilter.type = listOptions.extraFilters.type;
  }

  const { items, total } = await listDocumentsWithSearch(Resource, {
    baseFilter,
    listOptions,
    textSearch: true,
    regexFields: ["title", "description", "tags"],
    mapRow: mapResource,
  });
  return paginatedSuccess(res, items, total, listOptions);
};

export const createCohortResource = async (req, res) => {
  const body = req.body || {};
  const coerced = coerceResourcePayload(body, { isUpdate: false });
  const cohortId = req.params.cohortId || body.cohortId;
  const resource = await Resource.create({
    cohortId,
    founderId: body.founderId || null,
    ...coerced,
    createdBy: body.createdBy || req.user?.id || null,
  });
  const dto = mapResource(resource);
  const cohortOrg = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("organizationId")
    .lean();
  const orgId = cohortOrg?.organizationId ? String(cohortOrg.organizationId) : null;
  if (orgId) {
    emitToOrganization(orgId, SOCKET_EVENTS.RESOURCE_CREATED, {
      ...dto,
      cohortId: String(cohortId),
    });
  }
  return apiSuccess(res, { resource: dto }, 201);
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
  const { range, since } = parseAnalyticsRange(req.query);

  const members = await CohortMembership.find({ cohortId }).lean();
  const activeMembers = members.filter(
    (m) => !m.status || m.status === "active",
  );
  const founderIds = activeMembers.map((m) => m.founderId).filter(Boolean);
  const startupIds = activeMembers.map((m) => m.startupId).filter(Boolean);
  const founderIdStrings = founderIds.map((id) => String(id));
  const startupIdStrings = startupIds.map((id) => String(id));
  const cohortSize = activeMembers.length;
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const recentJoins = activeMembers.filter(
    (m) => m.joinedAt && new Date(m.joinedAt).getTime() >= thirtyDaysAgo,
  ).length;

  const taskFilter = { startupId: { $in: startupIds } };
  const outcomeFilter = { founderId: { $in: founderIds } };
  const milestoneFilter = { founderId: { $in: founderIds } };
  if (since) {
    taskFilter.updatedAt = { $gte: since };
    outcomeFilter.weekOf = { $gte: since };
    milestoneFilter.updatedAt = { $gte: since };
  }

  const [
    totalTeamMembers,
    totalWeeklyOutcomes,
    totalTasks,
    completedTasks,
    totalMilestones,
    completedMilestones,
    totalProgramMilestones,
    totalDeliverables,
    trends,
  ] = await Promise.all([
    TeamMemberProfile.countDocuments({ startupId: { $in: startupIds } }),
    WeeklyOutcome.countDocuments(outcomeFilter),
    Task.countDocuments(taskFilter),
    Task.countDocuments({ ...taskFilter, status: "completed" }),
    Milestone.countDocuments(milestoneFilter),
    Milestone.countDocuments({ ...milestoneFilter, status: "completed" }),
    ProgramMilestone.countDocuments({ cohortId }),
    Deliverable.countDocuments({ cohortId }),
    loadCohortAnalyticsTrends({
      founderIds: founderIdStrings,
      startupIds: startupIdStrings,
    }),
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
    range,
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
    trends,
  };

  return apiSuccess(res, { analytics });
};

export const getCohortPortfolioHealth = async (req, res) => {
  const cohortId = req.params.cohortId;
  const { founderIds, aggregatesByFounderId, displayByFounderId } =
    await loadPortfolioHealthAggregates(cohortId);

  const portfolio = founderIds.map((fid) => {
    const display = displayByFounderId.get(fid) || {};
    return buildPortfolioRow({
      founderId: fid,
      startupName: display.startupName || "Unnamed Startup",
      founderName: display.founderName || "Founder",
      aggregates: aggregatesByFounderId.get(fid),
    });
  });

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
