import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import * as publicController from "../controllers/public.controller.js";

const publicRouter = Router();

publicRouter.post(
  "/public/talent-waitlist",
  asyncHandler(publicController.submitTalentWaitlist),
);

export default publicRouter;
