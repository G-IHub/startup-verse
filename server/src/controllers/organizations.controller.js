import mongoose from "mongoose";
import Organization from "../models/Organization.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import ProgramMilestone from "../models/ProgramMilestone.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { loadCohortMembersEnriched } from "../utils/cohortMemberAggregation.js";
import { parseListQuery, paginatedSuccess, listDocumentsWithSearch } from "../utils/listQuery.js";
import {
  loadStartupSnapshot,
  canViewStartupSnapshot,
} from "../utils/startupSnapshot.js";
import {
  computeCohortStats,
  computeCohortStatsBatch,
  zeroStats,
} from "../utils/cohortStats.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { organizationRoom } from "../realtime/rooms.js";

const PROGRAM_MILESTONE_CATEGORIES = [
  "general",
  "deliverable",
  "checkpoint",
  "validation",
  "customer-research",
  "product",
  "marketing",
  "sales",
];

const COHORT_STATUSES = ["active", "upcoming", "completed", "archived"];

const STRUCTURED_MILESTONE_STATUSES = [
  "pending",
  "in-progress",
  "completed",
  "blocked",
];

function normalizeStructuredMilestones(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      if (!title) return null;
      const tasks = Array.isArray(item.tasks)
        ? item.tasks
            .map((t) => (typeof t === "string" ? t.trim() : ""))
            .filter(Boolean)
        : [];
      return {
        title,
        tasks,
        owner: typeof item.owner === "string" ? item.owner : "",
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        status:
          typeof item.status === "string" &&
          STRUCTURED_MILESTONE_STATUSES.includes(item.status)
            ? item.status
            : "pending",
      };
    })
    .filter(Boolean);
}

function mapProgramMilestone(doc) {
  const m = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(m._id),
    cohortId: m.cohortId ? String(m.cohortId) : null,
    title: m.title,
    description: m.description || "",
    dueDate: m.dueDate || null,
    targetDate: m.dueDate || null,
    week: m.week ?? null,
    category: m.category || "general",
    structuredMilestones: Array.isArray(m.structuredMilestones)
      ? m.structuredMilestones
      : [],
    createdBy: m.createdBy ? String(m.createdBy) : null,
    createdAt: m.createdAt || null,
    updatedAt: m.updatedAt || null,
  };
}

// Mirrors the schema cap so we 400 early with a friendly message instead of
// letting Mongoose throw a generic validation error. Logos are URLs (either
// an absolute https URL from Cloudinary). Base64 payloads are no longer accepted - clients
// must upload via `POST /uploads` first and forward the returned URL.
const MAX_LOGO_URL_CHARS = 1000;
function normalizeLogoUrl(rawLogo) {
  if (rawLogo === undefined || rawLogo === null) {
    return { ok: true, value: undefined };
  }
  const value = String(rawLogo).trim();
  if (value.length > MAX_LOGO_URL_CHARS) {
    return {
      ok: false,
      message:
        "Logo must be a URL (max 1000 chars). Base64 payloads are no longer accepted - upload via POST /uploads first.",
    };
  }
  return { ok: true, value };
}

export const createOrganization = async (req, res) => {
  const rawType = req.body?.type;
  const organizationType =
    rawType != null && String(rawType).trim() !== ""
      ? String(rawType).trim().toLowerCase()
      : null;

  const logoCheck = normalizeLogoUrl(req.body?.logo);
  if (!logoCheck.ok) {
    return apiError(res, logoCheck.message, 400);
  }

  const organization = await Organization.create({
    name: req.body?.name || "Organization",
    description: req.body?.description || "",
    logo: logoCheck.value ?? "",
    website: req.body?.website || "",
    createdBy: req.body?.createdBy || req.user.id,
    settings: organizationType ? { organizationType } : {},
  });

  await OrganizationAdmin.findOneAndUpdate(
    { organizationId: organization._id, userId: req.user.id },
    { organizationId: organization._id, userId: req.user.id },
    { upsert: true, new: true },
  );

  return apiSuccess(res, organization, 201);
};

export const getOrganizationsByUser = async (req, res) => {
  const adminMemberships = await OrganizationAdmin.find({ userId: req.params.userId });
  const orgIds = adminMemberships.map((membership) => membership.organizationId);
  const organizations = await Organization.find({ _id: { $in: orgIds } });
  return apiSuccess(res, organizations);
};

export const getOrganizationById = async (req, res) => {
  const organization = await Organization.findById(req.params.orgId);
  if (!organization) {
    return apiError(res, "Organization not found.", 404);
  }
  return apiSuccess(res, organization);
};

export const updateOrganization = async (req, res) => {
  const updates = {
    name: req.body?.name,
    description: req.body?.description,
    website: req.body?.website,
  };

  if (req.body?.logo !== undefined) {
    const logoCheck = normalizeLogoUrl(req.body.logo);
    if (!logoCheck.ok) {
      return apiError(res, logoCheck.message, 400);
    }
    updates.logo = logoCheck.value ?? "";
  }

  const organization = await Organization.findByIdAndUpdate(req.params.orgId, updates, {
    new: true,
    runValidators: true,
  });

  if (!organization) {
    return apiError(res, "Organization not found.", 404);
  }

  return apiSuccess(res, organization);
};

export const getOrganizationAdmins = async (req, res) => {
  const orgId = req.params.orgId;

  const [organization, adminRows] = await Promise.all([
    Organization.findById(orgId).select("createdBy").lean(),
    OrganizationAdmin.find({ organizationId: orgId }).lean(),
  ]);

  if (!organization) {
    return apiError(res, "Organization not found.", 404);
  }
  if (adminRows.length === 0) {
    return apiSuccess(res, []);
  }

  const userIds = [...new Set(adminRows.map((row) => String(row.userId)))];
  const users = await User.find(
    { _id: { $in: userIds } },
    { name: 1, email: 1, avatarUrl: 1 },
  ).lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const creatorIdStr = String(organization.createdBy);

  const enriched = adminRows
    .map((row) => {
      const user = userById.get(String(row.userId));
      if (!user) return null;
      return {
        id: String(row._id),
        userId: String(row.userId),
        name: user.name || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        isCreator: String(row.userId) === creatorIdStr,
        addedAt: row.createdAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isCreator !== b.isCreator) return a.isCreator ? -1 : 1;
      return new Date(a.addedAt) - new Date(b.addedAt);
    });

  return apiSuccess(res, enriched);
};

export const getOrganizationAdminStatus = async (req, res) => {
  const { orgId, userId } = req.params;
  const [organization, membership] = await Promise.all([
    Organization.findById(orgId).select("createdBy").lean(),
    OrganizationAdmin.findOne({ organizationId: orgId, userId }).lean(),
  ]);

  if (!organization) {
    return apiError(res, "Organization not found.", 404);
  }

  const isCreator = String(organization.createdBy) === String(userId);
  const isAdmin = isCreator || Boolean(membership);

  return apiSuccess(res, { isAdmin, isCreator });
};

export const addOrganizationAdmin = async (req, res) => {
  const { adminUserId, email } = req.body || {};
  const orgId = req.params.orgId;

  let userDoc = null;

  if (email && typeof email === "string" && email.trim()) {
    userDoc = await User.findOne({ email: email.toLowerCase().trim() })
      .select("_id name email")
      .lean();
    if (!userDoc) {
      return apiError(res, "No registered user with that email.", 404);
    }
  } else if (adminUserId) {
    if (!mongoose.Types.ObjectId.isValid(String(adminUserId))) {
      return apiError(res, "adminUserId must be a valid id.", 400);
    }
    userDoc = await User.findById(adminUserId).select("_id name email").lean();
    if (!userDoc) {
      return apiError(res, "User not found.", 404);
    }
  } else {
    return apiError(res, "email or adminUserId is required.", 400);
  }

  const existing = await OrganizationAdmin.findOne({
    organizationId: orgId,
    userId: userDoc._id,
  }).lean();
  if (existing) {
    return apiError(res, "That user is already an admin.", 409);
  }

  let admin;
  try {
    admin = await OrganizationAdmin.create({
      organizationId: orgId,
      userId: userDoc._id,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return apiError(res, "That user is already an admin.", 409);
    }
    throw err;
  }

  return apiSuccess(
    res,
    {
      ...admin.toObject(),
      id: String(admin._id),
      name: userDoc.name || "",
      email: userDoc.email || "",
    },
    201,
  );
};

export const removeOrganizationAdmin = async (req, res) => {
  await OrganizationAdmin.findOneAndDelete({
    organizationId: req.params.orgId,
    userId: req.params.adminUserId,
  });

  return apiSuccess(res, { deleted: true });
};

export const createCohort = async (req, res) => {
  const cohort = await Cohort.create({
    organizationId: req.body?.organizationId || req.body?.orgId,
    name: req.body?.name || "Cohort",
    description: req.body?.description || "",
    startDate: req.body?.startDate || null,
    endDate: req.body?.endDate || null,
    status: req.body?.status || "active",
  });

  return apiSuccess(res, cohort, 201);
};

export const getCohortsByOrganization = async (req, res) => {
  const cohorts = await Cohort.find({
    organizationId: req.params.orgId,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean();
  const statsByCohort = await computeCohortStatsBatch(
    cohorts.map((c) => c._id),
  );
  return apiSuccess(
    res,
    cohorts.map((c) => ({
      ...c,
      stats: statsByCohort.get(String(c._id)) ?? zeroStats(),
    })),
  );
};

export const getCohortById = async (req, res) => {
  const cohort = await Cohort.findOne({
    _id: req.params.cohortId,
    deletedAt: null,
  }).lean();
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }
  const stats = await computeCohortStats(cohort._id);
  return apiSuccess(res, { ...cohort, stats });
};

/** PUT /organizations/cohorts/:cohortId - partial cohort update. */
export const updateCohort = async (req, res) => {
  const cohort = await Cohort.findOne({
    _id: req.params.cohortId,
    deletedAt: null,
  });
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }

  const body = req.body || {};
  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;

  if (has("name")) {
    const trimmed = String(body.name || "").trim();
    if (trimmed.length < 2) {
      return apiError(res, "Cohort name must be at least 2 characters.", 400);
    }
    cohort.name = trimmed;
  }
  if (has("description")) cohort.description = String(body.description || "");
  if (has("startDate")) cohort.startDate = body.startDate || null;
  if (has("endDate")) cohort.endDate = body.endDate || null;
  if (has("status")) {
    if (!COHORT_STATUSES.includes(body.status)) {
      return apiError(
        res,
        `status must be one of: ${COHORT_STATUSES.join(", ")}`,
        400,
      );
    }
    cohort.status = body.status;
  }

  await cohort.save();
  const stats = await computeCohortStats(cohort._id);
  const dto = { ...cohort.toObject(), stats };

  const orgId = cohort.organizationId ? String(cohort.organizationId) : null;
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.COHORT_UPDATED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, dto);
};

/** DELETE /organizations/cohorts/:cohortId - soft-delete (set deletedAt). */
export const deleteCohort = async (req, res) => {
  const cohort = await Cohort.findById(req.params.cohortId);
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }

  // Idempotent: if already deleted, return the same envelope.
  if (!cohort.deletedAt) {
    cohort.deletedAt = new Date();
    await cohort.save();
  }

  const orgId = cohort.organizationId ? String(cohort.organizationId) : null;
  if (orgId) {
    emitRealtime(
      SOCKET_EVENTS.COHORT_DELETED,
      {
        id: String(cohort._id),
        cohortId: String(cohort._id),
        organizationId: orgId,
        deletedAt: cohort.deletedAt,
      },
      [organizationRoom(orgId)],
    );
  }
  return apiSuccess(res, { deleted: true, deletedAt: cohort.deletedAt });
};

export const getCohortMembers = async (req, res) => {
  const listOptions = parseListQuery(req, {
    defaultSortBy: "joinedAt",
    allowedSortFields: ["joinedAt", "createdAt", "status"],
    defaultSortOrder: "desc",
  });
  const result = await loadCohortMembersEnriched(req.params.cohortId, listOptions);
  return paginatedSuccess(res, result.items, result.total, {
    limit: result.limit,
    skip: result.skip,
  });
};

/**
 * GET /startups/:id/snapshot — Step 2.9.
 *
 * `:id` may be a Startup `_id` (canonical) or the founder's User `_id`
 * (legacy callers). Access is granted to the founder, any team member,
 * mentors assigned to the founder, and admins of any organisation whose
 * cohort currently contains the founder.
 */
export const getStartupSnapshot = async (req, res) => {
  const snapshot = await loadStartupSnapshot(req.params.id);
  if (!snapshot) return apiError(res, "Startup not found.", 404);
  const allowed = await canViewStartupSnapshot(req.user, snapshot);
  if (!allowed) return apiError(res, "Forbidden.", 403);
  return apiSuccess(res, snapshot);
};

export const manageCohortMember = async (req, res) => {
  const membership = await CohortMembership.findOneAndUpdate(
    {
      cohortId: req.params.cohortId,
      startupId: req.body?.startupId,
    },
    {
      cohortId: req.params.cohortId,
      startupId: req.body?.startupId,
      founderId: req.body?.founderId,
      status: req.body?.status || "active",
    },
    { upsert: true, new: true, runValidators: true },
  );

  return apiSuccess(res, membership, 201);
};

export const updateOrganizationLogo = async (req, res) => {
  const candidate = req.body?.logo ?? req.body?.logoUrl ?? "";
  const check = normalizeLogoUrl(candidate);
  if (!check.ok) {
    return apiError(res, check.message, 400);
  }

  const organization = await Organization.findByIdAndUpdate(
    req.params.orgId,
    { logo: check.value ?? "" },
    { new: true, runValidators: true },
  );

  if (!organization) {
    return apiError(res, "Organization not found.", 404);
  }

  return apiSuccess(res, organization);
};

/** Distinct cohort ids where the user is a member founder (calendar / milestones). */
export const getCohortIdsForFounder = async (req, res) => {
  const memberships = await CohortMembership.find({ founderId: req.params.founderId }).select("cohortId").lean();
  const cohortIds = [...new Set(memberships.map((m) => String(m.cohortId)).filter(Boolean))];
  return apiSuccess(res, { cohortIds });
};

export const getProgramMilestonesByCohort = async (req, res) => {
  const listOptions = parseListQuery(req, {
    defaultSortBy: "dueDate",
    allowedSortFields: ["dueDate", "createdAt", "title", "week"],
    defaultSortOrder: "asc",
  });
  const baseFilter = { cohortId: req.params.cohortId };
  if (listOptions.status) {
    baseFilter.category = listOptions.status;
  }
  const { items, total } = await listDocumentsWithSearch(ProgramMilestone, {
    baseFilter,
    listOptions,
    textSearch: true,
    regexFields: ["title", "description"],
    mapRow: mapProgramMilestone,
  });
  return paginatedSuccess(res, items, total, listOptions);
};

/**
 * Translates a request body into a ProgramMilestone partial document. When
 * `isUpdate` is true, undefined fields are skipped so callers can PUT only the
 * fields they want to change.
 */
function coerceProgramMilestonePayload(body, { isUpdate = false } = {}) {
  const out = {};
  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;

  if (!isUpdate || has("title")) out.title = body.title || "Program Milestone";
  if (!isUpdate || has("description")) out.description = body.description || "";
  if (!isUpdate || has("dueDate")) out.dueDate = body.dueDate || null;
  if (!isUpdate || has("week")) {
    const raw = body.week;
    out.week =
      raw === null || raw === undefined || raw === ""
        ? null
        : Number.isFinite(Number(raw))
          ? Number(raw)
          : null;
  }
  if (!isUpdate || has("category")) {
    out.category = PROGRAM_MILESTONE_CATEGORIES.includes(body.category)
      ? body.category
      : "general";
  }
  if (!isUpdate || has("structuredMilestones")) {
    out.structuredMilestones = normalizeStructuredMilestones(body.structuredMilestones);
  }
  return out;
}

export const createProgramMilestone = async (req, res) => {
  const body = req.body || {};
  const milestone = await ProgramMilestone.create({
    cohortId: req.params.cohortId,
    ...coerceProgramMilestonePayload(body, { isUpdate: false }),
    createdBy: body.createdBy || req.user?.id || null,
  });

  return apiSuccess(res, mapProgramMilestone(milestone), 201);
};

/** PUT /cohorts/:cohortId/program-milestones/:milestoneId */
export const updateProgramMilestone = async (req, res) => {
  const { cohortId, milestoneId } = req.params;
  const milestone = await ProgramMilestone.findById(milestoneId);
  if (!milestone) {
    return apiError(res, "Program milestone not found.", 404);
  }
  if (String(milestone.cohortId) !== String(cohortId)) {
    return apiError(res, "Milestone does not belong to this cohort.", 403);
  }

  const patch = coerceProgramMilestonePayload(req.body || {}, { isUpdate: true });
  Object.assign(milestone, patch);
  await milestone.save();

  const dto = mapProgramMilestone(milestone);
  const cohort = await Cohort.findById(cohortId).select("organizationId").lean();
  const orgId = cohort?.organizationId ? String(cohort.organizationId) : null;
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.MILESTONE_UPDATED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, dto);
};

/** DELETE /cohorts/:cohortId/program-milestones/:milestoneId */
export const deleteProgramMilestone = async (req, res) => {
  const { cohortId, milestoneId } = req.params;
  const milestone = await ProgramMilestone.findById(milestoneId);
  if (!milestone) {
    return apiError(res, "Program milestone not found.", 404);
  }
  if (String(milestone.cohortId) !== String(cohortId)) {
    return apiError(res, "Milestone does not belong to this cohort.", 403);
  }

  const id = String(milestone._id);
  await ProgramMilestone.findByIdAndDelete(milestoneId);

  const cohort = await Cohort.findById(cohortId).select("organizationId").lean();
  const orgId = cohort?.organizationId ? String(cohort.organizationId) : null;
  if (orgId) {
    emitRealtime(
      SOCKET_EVENTS.MILESTONE_DELETED,
      { id, cohortId: String(cohortId), organizationId: orgId },
      [organizationRoom(orgId)],
    );
  }
  return apiSuccess(res, { deleted: true, id });
};
