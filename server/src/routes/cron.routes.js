import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { success as apiSuccess } from "../utils/apiResponse.js";

const cronRouter = Router();

cronRouter.post(
  "/cron/check-deadlines",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      triggered: true,
      type: "check-deadlines",
      at: new Date().toISOString(),
      payload: req.body || {},
    });
  }),
);

cronRouter.post(
  "/cron/check-weekly-reviews",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      triggered: true,
      type: "check-weekly-reviews",
      at: new Date().toISOString(),
      payload: req.body || {},
    });
  }),
);

export default cronRouter;