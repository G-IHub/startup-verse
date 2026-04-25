import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { notImplemented } from "../utils/compat.js";
import { seedLearningResources } from "../utils/seedLearningResources.js";
import { success as apiSuccess } from "../utils/apiResponse.js";

const migrationsRouter = Router();

migrationsRouter.post(
  "/migrate/auth-mappings",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "migrate.auth-mappings", ["Migration endpoint pending implementation."]);
  }),
);

migrationsRouter.post(
  "/migrations/fix-org-invitations",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "migrations.fix-org-invitations", ["Migration endpoint pending implementation."]);
  }),
);

migrationsRouter.post(
  "/migrations/fix-cohort-memberships",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "migrations.fix-cohort-memberships", ["Migration endpoint pending implementation."]);
  }),
);

migrationsRouter.post(
  "/migrations/seed-learning-resources",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await seedLearningResources();
    return apiSuccess(res, result);
  }),
);

export default migrationsRouter;
