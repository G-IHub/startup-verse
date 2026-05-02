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

// Get current authenticated user (uses cookie)
authRouter.get(
  "/auth/me",
  requireAuth,
  asyncHandler(authController.getMe)
);

// Logout - clear cookie
authRouter.post(
  "/auth/logout",
  asyncHandler(authController.logout)
);

export default authRouter;