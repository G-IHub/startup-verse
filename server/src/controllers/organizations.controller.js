import Organization from "../models/Organization.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import ProgramMilestone from "../models/ProgramMilestone.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

export const createOrganization = async (req, res) => {
  const rawType = req.body?.type;
  const organizationType =
    rawType != null && String(rawType).trim() !== ""
      ? String(rawType).trim().toLowerCase()
      : null;

  const organization = await Organization.create({
    name: req.body?.name || "Organization",
    description: req.body?.description || "",
    logo: req.body?.logo || "",
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
    logo: req.body?.logo,
    website: req.body?.website,
  };

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
  const admins = await OrganizationAdmin.find({ organizationId: req.params.orgId });
  return apiSuccess(res, admins);
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
  const { adminUserId } = req.body || {};
  if (!adminUserId) {
    return apiError(res, "adminUserId is required.", 400);
  }

  const admin = await OrganizationAdmin.findOneAndUpdate(
    { organizationId: req.params.orgId, userId: adminUserId },
    { organizationId: req.params.orgId, userId: adminUserId },
    { upsert: true, new: true },
  );

  return apiSuccess(res, admin, 201);
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
  const cohorts = await Cohort.find({ organizationId: req.params.orgId }).sort({ createdAt: -1 });
  return apiSuccess(res, cohorts);
};

export const getCohortById = async (req, res) => {
  const cohort = await Cohort.findById(req.params.cohortId);
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }
  return apiSuccess(res, cohort);
};

export const deleteCohort = async (req, res) => {
  await Cohort.findByIdAndDelete(req.params.cohortId);
  return apiSuccess(res, { deleted: true });
};

export const getCohortMembers = async (req, res) => {
  const members = await CohortMembership.find({ cohortId: req.params.cohortId });
  return apiSuccess(res, members);
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
  const organization = await Organization.findByIdAndUpdate(
    req.params.orgId,
    { logo: req.body?.logo || req.body?.logoUrl || "" },
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
  const rows = await ProgramMilestone.find({ cohortId: req.params.cohortId }).sort({ dueDate: 1 }).lean();
  const milestones = rows.map((m) => ({
    id: String(m._id),
    title: m.title,
    description: m.description || "",
    dueDate: m.dueDate || null,
    targetDate: m.dueDate || null,
  }));
  return apiSuccess(res, { milestones });
};

export const createProgramMilestone = async (req, res) => {
  const milestone = await ProgramMilestone.create({
    cohortId: req.params.cohortId,
    title: req.body?.title || "Program Milestone",
    description: req.body?.description || "",
    dueDate: req.body?.dueDate || null,
  });

  return apiSuccess(res, milestone, 201);
};
