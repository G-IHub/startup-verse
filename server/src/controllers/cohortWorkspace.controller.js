import Event from "../models/Event.js";
import Announcement from "../models/Announcement.js";
import Resource from "../models/Resource.js";
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
import { success as apiSuccess } from "../utils/apiResponse.js";

function mapEvent(e) {
  const o = e.toObject ? e.toObject() : e;
  return {
    ...o,
    id: String(o._id),
    startTime: o.startsAt,
    endTime: o.endsAt,
  };
}

export const listCohortEvents = async (req, res) => {
  const rows = await Event.find({ cohortId: req.params.cohortId }).sort({ startsAt: 1 });
  return apiSuccess(res, { events: rows.map(mapEvent) });
};

export const createCohortEvent = async (req, res) => {
  const body = req.body || {};
  const startsAt = body.startsAt || body.startTime || new Date();
  const endsAt = body.endsAt || body.endTime || null;
  const event = await Event.create({
    cohortId: req.params.cohortId || body.cohortId,
    founderId: body.founderId || null,
    organizationId: body.organizationId || null,
    title: body.title || "Event",
    description: body.description || "",
    startsAt,
    endsAt,
    location: body.location || "",
    attendees: body.attendees || [],
  });
  return apiSuccess(res, { event: mapEvent(event) }, 201);
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
  const announcement = await Announcement.create({
    cohortId: req.params.cohortId || body.cohortId,
    founderId: body.founderId || null,
    organizationId: body.organizationId || null,
    title: body.title || "Announcement",
    body: body.body || body.message || "",
  });
  const o = announcement.toObject();
  return apiSuccess(res, { announcement: { ...o, id: String(o._id) } }, 201);
};

export const listCohortResources = async (req, res) => {
  const rows = await Resource.find({ cohortId: req.params.cohortId }).sort({ createdAt: -1 });
  return apiSuccess(res, {
    resources: rows.map((r) => {
      const o = r.toObject();
      return { ...o, id: String(o._id) };
    }),
  });
};

export const createCohortResource = async (req, res) => {
  const body = req.body || {};
  const resource = await Resource.create({
    cohortId: req.params.cohortId || body.cohortId,
    founderId: body.founderId || null,
    title: body.title || "Resource",
    description: body.description || "",
    url: body.url || "",
  });
  const o = resource.toObject();
  return apiSuccess(res, { resource: { ...o, id: String(o._id) } }, 201);
};

export const getCohortAnalyticsOverview = async (req, res) => {
  const cohortId = req.params.cohortId;
  const members = await CohortMembership.find({ cohortId });
  const founderIds = members.map((m) => m.founderId).filter(Boolean);
  const startupIds = members.map((m) => m.startupId).filter(Boolean);
  const cohortSize = members.length;

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
