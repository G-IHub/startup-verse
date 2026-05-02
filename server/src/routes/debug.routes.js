import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import * as debugController from "../controllers/debug.controller.js";

const debugRouter = Router();

debugRouter.get(
  "/debug/startups/:startupId",
  requireAuth,
  requireRole("admin"),
  asyncHandler(debugController.getStartupDebug),
);

// Reset a team-member back to talent. Admin only — destructive helper.
debugRouter.get(
  "/debug/leave-startup/:userId",
  requireAuth,
  requireRole("admin"),
  asyncHandler(debugController.leaveStartupDebug),
);

export default debugRouter;
