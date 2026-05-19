import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import requireCohortReadAccess from "../middleware/requireCohortReadAccess.js";
import requireOrganizationScope from "../middleware/requireOrganizationScope.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as organizationsController from "../controllers/organizations.controller.js";
import * as cohortWorkspaceController from "../controllers/cohortWorkspace.controller.js";
import * as mentorsController from "../controllers/mentors.controller.js";

const organizationsRouter = Router();

organizationsRouter.post("/organizations/create", requireAuth, asyncHandler(organizationsController.createOrganization));
organizationsRouter.get("/organizations/user/:userId", requireAuth, requireSelfOrAdmin("userId"), asyncHandler(organizationsController.getOrganizationsByUser));
organizationsRouter.get("/organizations/:orgId/mentors", requireAuth, asyncHandler(mentorsController.listOrganizationMentors));
organizationsRouter.post(
  "/organizations/:orgId/mentors",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(mentorsController.inviteOrganizationMentor),
);
organizationsRouter.get("/organizations/:orgId", requireAuth, asyncHandler(organizationsController.getOrganizationById));
organizationsRouter.get(
  "/organizations/:orgId/is-admin/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(organizationsController.getOrganizationAdminStatus),
);
organizationsRouter.put("/organizations/:orgId/update", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.updateOrganization));
organizationsRouter.put("/organizations/:orgId/logo", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.updateOrganizationLogo));
// Blueprint §14 verb alias: POST /organizations/:orgId/logo
organizationsRouter.post("/organizations/:orgId/logo", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.updateOrganizationLogo));

organizationsRouter.get("/organizations/:orgId/admins", requireAuth, asyncHandler(organizationsController.getOrganizationAdmins));
organizationsRouter.post("/organizations/:orgId/admins", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.addOrganizationAdmin));
organizationsRouter.post("/organizations/:orgId/admins/add", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.addOrganizationAdmin));
organizationsRouter.delete("/organizations/:orgId/admins/:adminUserId", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.removeOrganizationAdmin));
organizationsRouter.delete("/organizations/:orgId/admins/:adminUserId/remove", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.removeOrganizationAdmin));

organizationsRouter.post("/cohorts/create", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.createCohort));
organizationsRouter.get(
  "/cohorts/organization/:orgId",
  requireAuth,
  requireOrganizationScope,
  asyncHandler(organizationsController.getCohortsByOrganization),
);
organizationsRouter.get(
  "/cohorts/founder/:founderId",
  requireAuth,
  requireSelfOrAdmin("founderId"),
  asyncHandler(organizationsController.getCohortIdsForFounder),
);
organizationsRouter.get(
  "/cohorts/:cohortId/program-milestones",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(organizationsController.getProgramMilestonesByCohort),
);
organizationsRouter.post(
  "/cohorts/:cohortId/program-milestones",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationsController.createProgramMilestone),
);
organizationsRouter.put(
  "/cohorts/:cohortId/program-milestones/:milestoneId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationsController.updateProgramMilestone),
);
organizationsRouter.delete(
  "/cohorts/:cohortId/program-milestones/:milestoneId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationsController.deleteProgramMilestone),
);
organizationsRouter.get(
  "/cohorts/:cohortId/events",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(cohortWorkspaceController.listCohortEvents),
);
organizationsRouter.post(
  "/cohorts/:cohortId/events",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.createCohortEvent),
);
organizationsRouter.put(
  "/cohorts/:cohortId/events/:eventId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.updateCohortEvent),
);
organizationsRouter.delete(
  "/cohorts/:cohortId/events/:eventId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.deleteCohortEvent),
);
organizationsRouter.get(
  "/cohorts/:cohortId/announcements",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(cohortWorkspaceController.listCohortAnnouncements),
);
organizationsRouter.post(
  "/cohorts/:cohortId/announcements",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.createCohortAnnouncement),
);
organizationsRouter.put(
  "/cohorts/:cohortId/announcements/:announcementId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.updateCohortAnnouncement),
);
organizationsRouter.delete(
  "/cohorts/:cohortId/announcements/:announcementId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.deleteCohortAnnouncement),
);
organizationsRouter.post(
  "/cohorts/:cohortId/announcements/:announcementId/read",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(cohortWorkspaceController.markAnnouncementRead),
);
organizationsRouter.get(
  "/cohorts/:cohortId/resources",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(cohortWorkspaceController.listCohortResources),
);
organizationsRouter.post(
  "/cohorts/:cohortId/resources",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.createCohortResource),
);
organizationsRouter.put(
  "/cohorts/:cohortId/resources/:resourceId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.updateCohortResource),
);
organizationsRouter.delete(
  "/cohorts/:cohortId/resources/:resourceId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.deleteCohortResource),
);
organizationsRouter.get(
  "/cohorts/:cohortId/analytics/overview",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(cohortWorkspaceController.getCohortAnalyticsOverview),
);
organizationsRouter.get(
  "/cohorts/:cohortId/portfolio-health",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(cohortWorkspaceController.getCohortPortfolioHealth),
);
organizationsRouter.get(
  "/cohorts/:cohortId",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(organizationsController.getCohortById),
);
organizationsRouter.put(
  "/cohorts/:cohortId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationsController.updateCohort),
);
organizationsRouter.delete(
  "/cohorts/:cohortId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(organizationsController.deleteCohort),
);

organizationsRouter.get(
  "/cohorts/:cohortId/badge-counts",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.getCohortBadgeCounts),
);
organizationsRouter.get(
  "/cohorts/:cohortId/export",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(cohortWorkspaceController.getCohortExport),
);
organizationsRouter.get(
  "/cohorts/:cohortId/members",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(organizationsController.getCohortMembers),
);
organizationsRouter.post("/cohorts/:cohortId/members", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.manageCohortMember));

// Step 2.9 — per-startup snapshot. Authorization (founder/team-member/mentor/
// org-admin) is enforced inside the controller because no single existing
// middleware composes these four roles cleanly.
organizationsRouter.get(
  "/startups/:id/snapshot",
  requireAuth,
  asyncHandler(organizationsController.getStartupSnapshot),
);

export default organizationsRouter;