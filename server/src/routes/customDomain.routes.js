import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as customDomainController from "../controllers/customDomain.controller.js";

const customDomainRouter = Router();

customDomainRouter.get("/founders/:founderId/custom-domain", requireAuth, asyncHandler(customDomainController.getCustomDomain));
customDomainRouter.post("/founders/:founderId/custom-domain", requireAuth, asyncHandler(customDomainController.createFounderCustomDomain));
customDomainRouter.post("/founders/:founderId/custom-domain/refresh", requireAuth, asyncHandler(customDomainController.refreshFounderCustomDomain));
customDomainRouter.delete("/founders/:founderId/custom-domain", requireAuth, asyncHandler(customDomainController.deleteFounderCustomDomain));

export default customDomainRouter;
