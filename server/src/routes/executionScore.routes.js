import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import Task from "../models/Task.js";
import { computeExecutionScoreMetrics } from "../domain/weeklyLoopRules.js";

const executionScoreRouter = Router();

executionScoreRouter.get(
  "/execution-score/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [tasks, outcomes] = await Promise.all([
      Task.find({ founderId: req.params.userId }),
      WeeklyOutcome.find({ founderId: req.params.userId }).sort({ weekOf: -1 }).limit(12),
    ]);

    const metrics = computeExecutionScoreMetrics(tasks, outcomes);

    return apiSuccess(res, {
      userId: req.params.userId,
      ...metrics,
    });
  }),
);

executionScoreRouter.all("/execution-score/:userId", requireAuth, asyncHandler(async (_req, res) => {
  return apiError(
    res,
    "Execution score is derived and read-only.",
    405,
    ["Use GET /execution-score/:userId to read computed metrics."],
  );
}));

export default executionScoreRouter;