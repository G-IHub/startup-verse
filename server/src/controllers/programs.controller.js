import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import Organization from "../models/Organization.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import ProgramJoinRequest from "../models/ProgramJoinRequest.js";
import ProgramNote from "../models/ProgramNote.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import {
  error as apiError,
  success as apiSuccess,
} from "../utils/apiResponse.js";
import { createNotification } from "../services/notificationService.js";
import { parsePageParams } from "../utils/taskAccess.js";

async function founderStartup(userId) {
  return Startup.findOne({ founderId: userId });
}

async function isOrgAdmin(userId, organizationId) {
  if (!userId || !organizationId) return false;
  const row = await OrganizationAdmin.findOne({
    userId,
    organizationId,
  }).lean();
  return Boolean(row);
}

async function canAccessProgramNotes(req, cohort) {
  if (req.user?.isAdmin) return true;
  if (await isOrgAdmin(req.user.id, cohort.organizationId)) return true;
  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 }).lean();
  if (!me) return false;
  const or = [{ founderId: req.user.id }];
  if (me.founderId) or.push({ founderId: me.founderId });
  if (me.startupId) or.push({ startupId: me.startupId });
  return Boolean(
    await CohortMembership.findOne({
      cohortId: cohort._id,
      status: "active",
      $or: or,
    }).lean(),
  );
}

export async function listListedPrograms(req, res) {
  if (req.user?.role !== "founder" && req.user?.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }
  const { page, pageSize, skip } = parsePageParams(req.query, 20);
  const filter = { listed: true, deletedAt: null };
  const [rows, total] = await Promise.all([
    Cohort.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Cohort.countDocuments(filter),
  ]);
  const orgIds = [...new Set(rows.map((row) => String(row.organizationId || "")).filter(Boolean))];
  const orgs = await Organization.find({ _id: { $in: orgIds } }, { name: 1 }).lean();
  const orgMap = Object.fromEntries(orgs.map((org) => [String(org._id), org.name]));
  const startup = await founderStartup(req.user.id);
  const memberships = startup
    ? await CohortMembership.find({
        startupId: startup._id,
        status: "active",
      }).lean()
    : [];
  const memberSet = new Set(memberships.map((row) => String(row.cohortId)));
  const pending = startup
    ? await ProgramJoinRequest.find({
        startupId: startup._id,
        status: "pending",
      }).lean()
    : [];
  const pendingSet = new Set(pending.map((row) => String(row.cohortId)));

  return apiSuccess(res, {
    programs: rows.map((row) => ({
      id: String(row._id),
      name: row.name,
      description: row.description || "",
      startDate: row.startDate,
      endDate: row.endDate,
      organizationId: String(row.organizationId || ""),
      organizationName: orgMap[String(row.organizationId)] || "",
      member: memberSet.has(String(row._id)),
      pending: pendingSet.has(String(row._id)),
    })),
    pagination: { page, pageSize, total },
  });
}

export async function createJoinRequest(req, res) {
  if (req.user?.role !== "founder" && req.user?.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }
  const cohort = await Cohort.findOne({
    _id: req.params.cohortId,
    deletedAt: null,
  });
  if (!cohort || cohort.listed !== true) {
    return apiError(res, "Program not found.", 404);
  }
  const startup = await founderStartup(req.user.id);
  if (!startup) {
    return apiError(res, "Create a startup before joining a program.", 422);
  }
  const member = await CohortMembership.findOne({
    cohortId: cohort._id,
    startupId: startup._id,
  });
  if (member) {
    return apiError(res, "Already a member of this program.", 409);
  }
  const existingPending = await ProgramJoinRequest.findOne({
    cohortId: cohort._id,
    startupId: startup._id,
    status: "pending",
  });
  if (existingPending) {
    return apiError(res, "A request is already pending.", 409);
  }

  const request = await ProgramJoinRequest.create({
    cohortId: cohort._id,
    founderId: req.user.id,
    startupId: startup._id,
    message: String(req.body?.message || "").trim().slice(0, 2000),
    status: "pending",
  });

  const admins = await OrganizationAdmin.find({
    organizationId: cohort.organizationId,
  }).lean();
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.userId,
        type: "program-join-request",
        title: "Program join request",
        message: `${startup.name || "A startup"} asked to join ${cohort.name}`,
        actionUrl: `/home`,
        metadata: {
          cohortId: String(cohort._id),
          requestId: String(request._id),
        },
      }),
    ),
  );

  return apiSuccess(res, { id: String(request._id), status: request.status }, 201);
}

export async function listJoinRequests(req, res) {
  const rows = await ProgramJoinRequest.find({
    cohortId: req.params.cohortId,
    ...(req.query.status ? { status: req.query.status } : {}),
  })
    .sort({ createdAt: -1 })
    .lean();
  const founderIds = rows.map((row) => row.founderId);
  const startupIds = rows.map((row) => row.startupId);
  const [founders, startups] = await Promise.all([
    User.find({ _id: { $in: founderIds } }, { name: 1, email: 1 }).lean(),
    Startup.find({ _id: { $in: startupIds } }, { name: 1 }).lean(),
  ]);
  const founderMap = Object.fromEntries(founders.map((u) => [String(u._id), u]));
  const startupMap = Object.fromEntries(startups.map((s) => [String(s._id), s]));
  return apiSuccess(res, {
    requests: rows.map((row) => ({
      id: String(row._id),
      status: row.status,
      message: row.message || "",
      createdAt: row.createdAt,
      founderName: founderMap[String(row.founderId)]?.name || "",
      startupName: startupMap[String(row.startupId)]?.name || "",
      founderId: String(row.founderId),
      startupId: String(row.startupId),
    })),
  });
}

export async function reviewJoinRequest(req, res) {
  const nextStatus = String(req.body?.status || "");
  if (nextStatus !== "accepted" && nextStatus !== "declined") {
    return apiError(res, "status must be accepted or declined.", 422);
  }
  const request = await ProgramJoinRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      cohortId: req.params.cohortId,
      status: "pending",
    },
    {
      status: nextStatus,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    },
    { new: true },
  );
  if (!request) {
    return apiError(res, "Request not found or already reviewed.", 409);
  }

  if (nextStatus === "accepted") {
    try {
      await CohortMembership.create({
        cohortId: request.cohortId,
        startupId: request.startupId,
        founderId: request.founderId,
        status: "active",
        joinedAt: new Date(),
      });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      return apiError(res, "Already a member of this program.", 409);
    }
  }

  const cohort = await Cohort.findById(request.cohortId, { name: 1 }).lean();
  await createNotification({
    userId: request.founderId,
    type: "program-join-review",
    title: nextStatus === "accepted" ? "Program request accepted" : "Program request declined",
    message:
      nextStatus === "accepted"
        ? `You joined ${cohort?.name || "the program"}`
        : `${cohort?.name || "The program"} declined your request`,
    actionUrl: "/program",
    metadata: { cohortId: String(request.cohortId), status: nextStatus },
  });

  return apiSuccess(res, { id: String(request._id), status: request.status });
}

export async function listNotes(req, res) {
  const cohort = await Cohort.findOne({
    _id: req.params.cohortId,
    deletedAt: null,
  });
  if (!cohort) return apiError(res, "Program not found.", 404);
  if (!(await canAccessProgramNotes(req, cohort))) {
    return apiError(res, "Forbidden.", 403);
  }
  const { page, pageSize, skip } = parsePageParams(req.query, 30);
  const [rows, total] = await Promise.all([
    ProgramNote.find({ cohortId: cohort._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    ProgramNote.countDocuments({ cohortId: cohort._id }),
  ]);
  const authors = await User.find(
    { _id: { $in: rows.map((row) => row.authorId) } },
    { name: 1, role: 1 },
  ).lean();
  const authorMap = Object.fromEntries(authors.map((u) => [String(u._id), u]));
  return apiSuccess(res, {
    notes: rows.map((row) => ({
      id: String(row._id),
      body: row.body,
      createdAt: row.createdAt,
      authorId: String(row.authorId),
      authorName: authorMap[String(row.authorId)]?.name || "",
      authorRole: authorMap[String(row.authorId)]?.role || "",
    })),
    pagination: { page, pageSize, total },
  });
}

export async function createNote(req, res) {
  const cohort = await Cohort.findOne({
    _id: req.params.cohortId,
    deletedAt: null,
  });
  if (!cohort) return apiError(res, "Program not found.", 404);
  if (!(await canAccessProgramNotes(req, cohort))) {
    return apiError(res, "Forbidden.", 403);
  }
  const body = String(req.body?.body || "").trim();
  if (!body) return apiError(res, "Note body is required.", 422);
  const note = await ProgramNote.create({
    cohortId: cohort._id,
    authorId: req.user.id,
    body: body.slice(0, 5000),
  });
  return apiSuccess(
    res,
    {
      id: String(note._id),
      body: note.body,
      createdAt: note.createdAt,
      authorId: String(note.authorId),
    },
    201,
  );
}
