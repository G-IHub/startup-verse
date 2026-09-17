import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as formSubmissionsController from "../controllers/formSubmissions.controller.js";

const formSubmissionsRouter = Router();

formSubmissionsRouter.get(
  "/founders/:founderId/form-submissions",
  requireAuth,
  asyncHandler(formSubmissionsController.listFormSubmissions),
);

export default formSubmissionsRouter;
