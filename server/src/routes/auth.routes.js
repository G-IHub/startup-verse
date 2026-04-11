import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/auth/signup", asyncHandler(authController.signup));
authRouter.post("/auth/signin", asyncHandler(authController.signin));

authRouter.put(
  "/auth/profile/:userId",
  requireAuth,
  asyncHandler(authController.updateProfile)
);

authRouter.get(
  "/auth/account/:userId",
  requireAuth,
  asyncHandler(authController.getAccount)
);

authRouter.delete(
  "/auth/account/:userId",
  requireAuth,
  asyncHandler(authController.deleteAccount)
);

export default authRouter;