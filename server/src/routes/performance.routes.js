import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import Task from "../models/Task.js";

const performanceRouter = Router();

/**
 * Blueprint §14: POST /api/v1/performance/invalidate/:memberId
 *
 * The repo does not maintain a server-side performance cache today; the
 * `getPerformance` endpoint always recomputes from `Task` documents. This
 * endpoint exists for parity: it acknowledges the request and returns a fresh
 * recomputation count so clients can confirm freshness. Self or admin only.
 */
performanceRouter.post(
  "/performance/invalidate/:memberId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberId = req.params.memberId;
    const isSelf = String(req.user.id) === String(memberId);
    if (!isSelf && req.user.isAdmin !== true) {
      return apiError(res, "Forbidden.", 403);
    }
    const taskCount = await Task.countDocuments({ assignedTo: memberId });
    return apiSuccess(res, {
      invalidated: true,
      memberId: String(memberId),
      taskCount,
      at: new Date().toISOString(),
    });
  }),
);

export default performanceRouter;
