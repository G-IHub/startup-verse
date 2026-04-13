import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as debugController from "../controllers/debug.controller.js";

const debugRouter = Router();

debugRouter.get(
  "/debug/startups/:startupId",
  requireAuth,
  asyncHandler(debugController.getStartupDebug),
);

export default debugRouter;
