import { Router } from "express";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { notImplemented } from "../utils/compat.js";
import MentorProfile from "../models/MentorProfile.js";
import Event from "../models/Event.js";
import Announcement from "../models/Announcement.js";
import Resource from "../models/Resource.js";
import ProgramMilestone from "../models/ProgramMilestone.js";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import Organization from "../models/Organization.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import { assertFounderInMentorOrganization } from "../utils/mentorFounderAssignment.js";
import requireMentorProfileAccess from "../middleware/requireMentorProfileAccess.js";
import requireMentorProfileOrgAdmin from "../middleware/requireMentorProfileOrgAdmin.js";

const compatibilityRouter = Router();

function compatPayload(routeId, data) {
  return {
    ...data,
    _compat: {
      deprecated: true,
      routeId,
      removalTarget: "post-client-cutover",
    },
  };
}

compatibilityRouter.get(
  "/mentors/verify/:token",
  asyncHandler(async (req, res) => {
    return apiSuccess(
      res,
      compatPayload("mentors.verify", {
        verified: true,
        token: req.params.token,
      }),
    );
  }),
);

compatibilityRouter.post(
  "/mentors/request-link",
  asyncHandler(async (req, res) => {
    return apiSuccess(
      res,
      compatPayload("mentors.request-link", {
        sent: true,
        email: req.body?.email || "",
      }),
    );
  }),
);

compatibilityRouter.get(
  "/mentors/organization/:organizationId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const mentors = await MentorProfile.find({ organizationId: req.params.organizationId }).sort({ createdAt: -1 });
    return apiSuccess(res, compatPayload("mentors.organization", mentors));
  }),
);

compatibilityRouter.post(
  "/mentors/invite",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, organizationId, expertise = [] } = req.body || {};
    const mentor = await MentorProfile.findOneAndUpdate(
      { userId },
      { userId, organizationId, expertise },
      { upsert: true, new: true, runValidators: true },
    );

    return apiSuccess(res, compatPayload("mentors.invite", mentor), 201);
  }),
);

compatibilityRouter.get(
  "/mentors/:mentorId",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(async (req, res) => {
    const mentor = await MentorProfile.findById(req.params.mentorId);
    if (!mentor) {
      return apiError(res, "Mentor not found.", 404);
    }

    return apiSuccess(res, compatPayload("mentors.by-id", mentor));
  }),
);

compatibilityRouter.delete(
  "/mentors/:mentorId",
  requireAuth,
  requireMentorProfileOrgAdmin,
  asyncHandler(async (req, res) => {
    await MentorProfile.findByIdAndDelete(req.params.mentorId);
    return apiSuccess(res, compatPayload("mentors.delete", { deleted: true }));
  }),
);

compatibilityRouter.get(
  "/mentors/:mentorId/assigned-founders",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(async (req, res) => {
    const mentor = await MentorProfile.findById(req.params.mentorId);
    if (!mentor) {
      return apiError(res, "Mentor not found.", 404);
    }

    return apiSuccess(
      res,
      compatPayload("mentors.assigned-founders", {
        mentorId: req.params.mentorId,
        founderIds: mentor.assignedFounders || [],
      }),
    );
  }),
);

compatibilityRouter.post(
  "/mentors/:mentorId/assign-founder",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(async (req, res) => {
    const founderId = String(req.body?.founderId || "").trim();
    const cohortId = req.body?.cohortId ? String(req.body.cohortId).trim() : "";
    if (!founderId) {
      return apiError(res, "founderId is required.", 400);
    }

    const mentor = await MentorProfile.findById(req.params.mentorId);
    if (!mentor) {
      return apiError(res, "Mentor not found.", 404);
    }
    if (!mentor.organizationId) {
      return apiError(res, "Mentor is not linked to an organization.", 400);
    }

    const scope = await assertFounderInMentorOrganization(
      founderId,
      mentor.organizationId,
      cohortId || null,
    );
    if (!scope.ok) {
      return apiError(res, scope.message, 400);
    }

    const founders = new Set((mentor.assignedFounders || []).map((id) => String(id)));
    founders.add(founderId);
    mentor.assignedFounders = Array.from(founders);
    await mentor.save();

    return apiSuccess(res, compatPayload("mentors.assign-founder", mentor));
  }),
);

compatibilityRouter.delete(
  "/mentors/:mentorId/unassign-founder/:founderId",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(async (req, res) => {
    const mentor = await MentorProfile.findById(req.params.mentorId);
    if (!mentor) {
      return apiError(res, "Mentor not found.", 404);
    }

    mentor.assignedFounders = (mentor.assignedFounders || []).filter(
      (item) => String(item) !== String(req.params.founderId),
    );
    await mentor.save();

    return apiSuccess(res, compatPayload("mentors.unassign-founder", mentor));
  }),
);

compatibilityRouter.get(
  "/events/:cohortId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const events = await Event.find({ cohortId: req.params.cohortId }).sort({ startsAt: 1 });
    return apiSuccess(res, compatPayload("events.by-cohort", events));
  }),
);

compatibilityRouter.post(
  "/events/create",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.create({
      cohortId: req.body?.cohortId,
      founderId: req.body?.founderId || null,
      organizationId: req.body?.organizationId || null,
      title: req.body?.title || "Event",
      description: req.body?.description || "",
      startsAt: req.body?.startsAt || new Date(),
      endsAt: req.body?.endsAt || null,
      location: req.body?.location || "",
    });

    return apiSuccess(res, compatPayload("events.create", event), 201);
  }),
);

compatibilityRouter.post(
  "/events/:eventId/rsvp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return apiError(res, "Event not found.", 404);
    }

    event.attendees = [
      ...(event.attendees || []).filter((item) => String(item.userId) !== String(req.user.id)),
      { userId: req.user.id, status: req.body?.status || "going", at: new Date().toISOString() },
    ];

    await event.save();

    return apiSuccess(res, compatPayload("events.rsvp", event));
  }),
);

compatibilityRouter.get(
  "/events/upcoming",
  requireAuth,
  asyncHandler(async (req, res) => {
    const start = req.query?.start ? new Date(String(req.query.start)) : new Date();
    const end = req.query?.end ? new Date(String(req.query.end)) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const events = await Event.find({ startsAt: { $gte: start, $lte: end } }).sort({ startsAt: 1 });

    return apiSuccess(res, compatPayload("events.upcoming", events));
  }),
);

compatibilityRouter.get(
  "/announcements/:cohortId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const announcements = await Announcement.find({ cohortId: req.params.cohortId }).sort({ createdAt: -1 });
    return apiSuccess(res, compatPayload("announcements.by-cohort", announcements));
  }),
);

compatibilityRouter.post(
  "/announcements/create",
  requireAuth,
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.create({
      cohortId: req.body?.cohortId || null,
      founderId: req.body?.founderId || null,
      organizationId: req.body?.organizationId || null,
      title: req.body?.title || "Announcement",
      body: req.body?.body || req.body?.message || "",
    });

    return apiSuccess(res, compatPayload("announcements.create", announcement), 201);
  }),
);

compatibilityRouter.post(
  "/announcements/:announcementId/mark-read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findById(req.params.announcementId);
    if (!announcement) {
      return apiError(res, "Announcement not found.", 404);
    }

    const readBy = new Set(announcement.readBy || []);
    readBy.add(req.user.id);
    announcement.readBy = Array.from(readBy);
    await announcement.save();

    return apiSuccess(res, compatPayload("announcements.mark-read", announcement));
  }),
);

compatibilityRouter.get(
  "/resources/:cohortId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resources = await Resource.find({ cohortId: req.params.cohortId }).sort({ createdAt: -1 });
    return apiSuccess(res, compatPayload("resources.by-cohort", resources));
  }),
);

compatibilityRouter.get(
  "/resources/founder/:founderId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resources = await Resource.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
    return apiSuccess(res, compatPayload("resources.by-founder", resources));
  }),
);

compatibilityRouter.post(
  "/resources/create",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resource = await Resource.create({
      cohortId: req.body?.cohortId || null,
      founderId: req.body?.founderId || null,
      title: req.body?.title || "Resource",
      description: req.body?.description || "",
      url: req.body?.url || "",
    });

    return apiSuccess(res, compatPayload("resources.create", resource), 201);
  }),
);

compatibilityRouter.get(
  "/program-milestones/:cohortId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const milestones = await ProgramMilestone.find({ cohortId: req.params.cohortId }).sort({ dueDate: 1 });
    return apiSuccess(res, compatPayload("program-milestones.by-cohort", milestones));
  }),
);

compatibilityRouter.post(
  "/program-milestones/create",
  requireAuth,
  asyncHandler(async (req, res) => {
    const milestone = await ProgramMilestone.create({
      cohortId: req.body?.cohortId,
      title: req.body?.title || "Program Milestone",
      description: req.body?.description || "",
      dueDate: req.body?.dueDate || null,
    });

    return apiSuccess(res, compatPayload("program-milestones.create", milestone), 201);
  }),
);

compatibilityRouter.get(
  "/analytics/:entityId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [taskCount, startupCount] = await Promise.all([
      Task.countDocuments({ founderId: req.params.entityId }),
      Startup.countDocuments({ founderId: req.params.entityId }),
    ]);

    return apiSuccess(
      res,
      compatPayload("analytics.entity", {
        entityId: req.params.entityId,
        taskCount,
        startupCount,
      }),
    );
  }),
);

compatibilityRouter.get(
  "/analytics/:cohortId/overview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [memberCount, deliverableCount, eventCount] = await Promise.all([
      CohortMembership.countDocuments({ cohortId: req.params.cohortId }),
      ProgramMilestone.countDocuments({ cohortId: req.params.cohortId }),
      Event.countDocuments({ cohortId: req.params.cohortId }),
    ]);

    return apiSuccess(
      res,
      compatPayload("analytics.cohort-overview", {
        cohortId: req.params.cohortId,
        memberCount,
        deliverableCount,
        eventCount,
      }),
    );
  }),
);

compatibilityRouter.get(
  "/portfolio/:cohortId/health",
  requireAuth,
  asyncHandler(async (req, res) => {
    const members = await CohortMembership.find({ cohortId: req.params.cohortId });
    const founderIds = members.map((member) => member.founderId).filter(Boolean);
    const startupCount = members.length;

    return apiSuccess(
      res,
      compatPayload("portfolio.health", {
        cohortId: req.params.cohortId,
        startupCount,
        founderIds,
      }),
    );
  }),
);

compatibilityRouter.get(
  "/kv/get",
  requireAuth,
  asyncHandler(async (req, res) => {
    const key = String(req.query?.key || "");
    return apiSuccess(
      res,
      compatPayload("kv.get", {
        key,
        value: null,
      }),
    );
  }),
);

compatibilityRouter.get(
  "/debug/startup/:startupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [startup, tasks, members] = await Promise.all([
      Startup.findById(req.params.startupId),
      Task.countDocuments({ startupId: req.params.startupId }),
      CohortMembership.countDocuments({ startupId: req.params.startupId }),
    ]);

    return apiSuccess(
      res,
      compatPayload("debug.startup", {
        startup,
        taskCount: tasks,
        membershipCount: members,
      }),
    );
  }),
);

compatibilityRouter.get(
  "/admin/stats",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [users, startups, organizations] = await Promise.all([
      User.countDocuments(),
      Startup.countDocuments(),
      Organization.countDocuments(),
    ]);

    return apiSuccess(
      res,
      compatPayload("admin.stats", {
        users,
        startups,
        organizations,
      }),
    );
  }),
);

compatibilityRouter.post(
  "/admin/clear-all-data",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "admin.clear-all-data", ["Destructive endpoint intentionally disabled."]);
  }),
);

compatibilityRouter.post(
  "/admin/nuclear-reset",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "admin.nuclear-reset", ["Destructive endpoint intentionally disabled."]);
  }),
);

compatibilityRouter.post(
  "/admin/mega-nuclear-reset",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "admin.mega-nuclear-reset", ["Destructive endpoint intentionally disabled."]);
  }),
);

compatibilityRouter.post(
  "/emails/test",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(
      res,
      compatPayload("emails.test", {
        sent: true,
        transport: "placeholder",
      }),
    );
  }),
);

compatibilityRouter.post(
  "/emails/send-invitation",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(
      res,
      compatPayload("emails.send-invitation", {
        sent: true,
        id: crypto.randomUUID(),
        payload: req.body || {},
      }),
    );
  }),
);

compatibilityRouter.post(
  "/emails/send-notification",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(
      res,
      compatPayload("emails.send-notification", {
        sent: true,
        id: crypto.randomUUID(),
        payload: req.body || {},
      }),
    );
  }),
);

compatibilityRouter.post(
  "/emails/send-welcome",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(
      res,
      compatPayload("emails.send-welcome", {
        sent: true,
        id: crypto.randomUUID(),
        payload: req.body || {},
      }),
    );
  }),
);

compatibilityRouter.post(
  "/migrate/auth-mappings",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "migrate.auth-mappings", ["Migration endpoint pending implementation."]);
  }),
);

compatibilityRouter.post(
  "/migrations/fix-org-invitations",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "migrations.fix-org-invitations", ["Migration endpoint pending implementation."]);
  }),
);

compatibilityRouter.post(
  "/migrations/fix-cohort-memberships",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "migrations.fix-cohort-memberships", ["Migration endpoint pending implementation."]);
  }),
);

export default compatibilityRouter;