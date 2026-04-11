import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as organizationsController from "../controllers/organizations.controller.js";
import * as cohortWorkspaceController from "../controllers/cohortWorkspace.controller.js";
import * as mentorsController from "../controllers/mentors.controller.js";

const organizationsRouter = Router();

organizationsRouter.post("/organizations/create", requireAuth, asyncHandler(organizationsController.createOrganization));
organizationsRouter.get("/organizations/user/:userId", requireAuth, requireSelfOrAdmin("userId"), asyncHandler(organizationsController.getOrganizationsByUser));
organizationsRouter.get("/organizations/:orgId/mentors", requireAuth, asyncHandler(mentorsController.listOrganizationMentors));
organizationsRouter.post("/organizations/:orgId/mentors", requireAuth, asyncHandler(mentorsController.inviteOrganizationMentor));
organizationsRouter.get("/organizations/:orgId", requireAuth, asyncHandler(organizationsController.getOrganizationById));
organizationsRouter.put("/organizations/:orgId/update", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.updateOrganization));
organizationsRouter.put("/organizations/:orgId/logo", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.updateOrganizationLogo));

organizationsRouter.get("/organizations/:orgId/admins", requireAuth, asyncHandler(organizationsController.getOrganizationAdmins));
organizationsRouter.post("/organizations/:orgId/admins", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.addOrganizationAdmin));
organizationsRouter.post("/organizations/:orgId/admins/add", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.addOrganizationAdmin));
organizationsRouter.delete("/organizations/:orgId/admins/:adminUserId", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.removeOrganizationAdmin));
organizationsRouter.delete("/organizations/:orgId/admins/:adminUserId/remove", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.removeOrganizationAdmin));

organizationsRouter.post("/cohorts/create", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.createCohort));
organizationsRouter.get("/cohorts/organization/:orgId", requireAuth, asyncHandler(organizationsController.getCohortsByOrganization));
organizationsRouter.get(
  "/cohorts/founder/:founderId",
  requireAuth,
  requireSelfOrAdmin("founderId"),
  asyncHandler(organizationsController.getCohortIdsForFounder),
);
organizationsRouter.get(
  "/cohorts/:cohortId/program-milestones",
  requireAuth,
  asyncHandler(organizationsController.getProgramMilestonesByCohort),
);
organizationsRouter.post(
  "/cohorts/:cohortId/program-milestones",
  requireAuth,
  asyncHandler(organizationsController.createProgramMilestone),
);
organizationsRouter.get("/cohorts/:cohortId/events", requireAuth, asyncHandler(cohortWorkspaceController.listCohortEvents));
organizationsRouter.post("/cohorts/:cohortId/events", requireAuth, asyncHandler(cohortWorkspaceController.createCohortEvent));
organizationsRouter.get(
  "/cohorts/:cohortId/announcements",
  requireAuth,
  asyncHandler(cohortWorkspaceController.listCohortAnnouncements),
);
organizationsRouter.post(
  "/cohorts/:cohortId/announcements",
  requireAuth,
  asyncHandler(cohortWorkspaceController.createCohortAnnouncement),
);
organizationsRouter.get(
  "/cohorts/:cohortId/resources",
  requireAuth,
  asyncHandler(cohortWorkspaceController.listCohortResources),
);
organizationsRouter.post(
  "/cohorts/:cohortId/resources",
  requireAuth,
  asyncHandler(cohortWorkspaceController.createCohortResource),
);
organizationsRouter.get(
  "/cohorts/:cohortId/analytics/overview",
  requireAuth,
  asyncHandler(cohortWorkspaceController.getCohortAnalyticsOverview),
);
organizationsRouter.get(
  "/cohorts/:cohortId/portfolio-health",
  requireAuth,
  asyncHandler(cohortWorkspaceController.getCohortPortfolioHealth),
);
organizationsRouter.get("/cohorts/:cohortId", requireAuth, asyncHandler(organizationsController.getCohortById));
organizationsRouter.delete("/cohorts/:cohortId", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.deleteCohort));

organizationsRouter.get("/cohorts/:cohortId/members", requireAuth, asyncHandler(organizationsController.getCohortMembers));
organizationsRouter.post("/cohorts/:cohortId/members", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.manageCohortMember));

export default organizationsRouter;