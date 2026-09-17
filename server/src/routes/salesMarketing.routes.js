import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as salesMarketingController from "../controllers/salesMarketing.controller.js";

const salesMarketingRouter = Router();

salesMarketingRouter.post(
  "/founders/:founderId/agents/:agentKey/generate",
  requireAuth,
  asyncHandler(salesMarketingController.generateOutput),
);

salesMarketingRouter.get(
  "/founders/:founderId/agents/:agentKey/outputs",
  requireAuth,
  asyncHandler(salesMarketingController.listOutputs),
);

export default salesMarketingRouter;
