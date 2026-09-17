import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as calendlyController from "../controllers/calendly.controller.js";

const calendlyRouter = Router();

calendlyRouter.get("/calendly/oauth/authorize", requireAuth, asyncHandler(calendlyController.authorize));
calendlyRouter.get("/calendly/oauth/callback", asyncHandler(calendlyController.callback));
calendlyRouter.get("/founders/:founderId/calendly", requireAuth, asyncHandler(calendlyController.getConnection));
calendlyRouter.delete("/founders/:founderId/calendly", requireAuth, asyncHandler(calendlyController.disconnect));

// Public — Calendly posts booking events here. No requireAuth: Calendly can't
// send our session cookies. Security is handled by webhook signature verification
// inside the controller instead.
calendlyRouter.post("/calendly/webhook", asyncHandler(calendlyController.handleWebhook));

export default calendlyRouter;
