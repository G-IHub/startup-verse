import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as projectsController from "../controllers/projects.controller.js";

const projectsRouter = Router();

projectsRouter.get(
  "/founders/:founderId/projects",
  requireAuth,
  asyncHandler(projectsController.listProjects),
);
projectsRouter.post(
  "/founders/:founderId/projects",
  requireAuth,
  asyncHandler(projectsController.createProject),
);
projectsRouter.get(
  "/founders/:founderId/projects/:projectSlug",
  requireAuth,
  asyncHandler(projectsController.getProject),
);
projectsRouter.put(
  "/founders/:founderId/projects/:projectSlug",
  requireAuth,
  asyncHandler(projectsController.updateProject),
);
projectsRouter.delete(
  "/founders/:founderId/projects/:projectSlug",
  requireAuth,
  asyncHandler(projectsController.archiveProject),
);
projectsRouter.post(
  "/founders/:founderId/projects/:projectSlug/members",
  requireAuth,
  asyncHandler(projectsController.addMember),
);
projectsRouter.delete(
  "/founders/:founderId/projects/:projectSlug/members/:userId",
  requireAuth,
  asyncHandler(projectsController.removeMember),
);
projectsRouter.put(
  "/founders/:founderId/projects/:projectSlug/github",
  requireAuth,
  asyncHandler(projectsController.connectGithub),
);
projectsRouter.post(
  "/founders/:founderId/projects/:projectSlug/github/sync",
  requireAuth,
  asyncHandler(projectsController.syncGithub),
);
projectsRouter.get(
  "/founders/:founderId/projects/:projectSlug/milestones",
  requireAuth,
  asyncHandler(projectsController.getProjectMilestones),
);
projectsRouter.get(
  "/founders/:founderId/projects/:projectSlug/tasks",
  requireAuth,
  asyncHandler(projectsController.getProjectTasks),
);

export default projectsRouter;
