import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { seedLearningResources } from "../utils/seedLearningResources.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import CohortInvitation from "../models/CohortInvitation.js";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";

const migrationsRouter = Router();

/**
 * Auth mapping migration is a no-op in current schema (User documents own
 * their own auth state directly). Endpoint kept for parity, returns idempotent ack.
 */
migrationsRouter.post(
  "/migrate/auth-mappings",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      migration: "auth-mappings",
      migrated: 0,
      note: "User auth state is canonical on the User document; no remap required.",
    });
  }),
);

/**
 * Migrate legacy `FounderTalentInvitation` rows with kind="org-founder" into the
 * canonical `CohortInvitation` collection. Idempotent: skips tokens already
 * present in CohortInvitation. Supports `dryRun=true` to preview.
 */
migrationsRouter.post(
  "/migrations/fix-org-invitations",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const dryRun = Boolean(req.body?.dryRun);
    const legacy = await FounderTalentInvitation.find({ kind: "org-founder" }).lean();
    let migrated = 0;
    let skipped = 0;
    const errors = [];

    for (const row of legacy) {
      try {
        const existing = row.token
          ? await CohortInvitation.findOne({ token: row.token }).lean()
          : null;
        if (existing) {
          skipped += 1;
          continue;
        }
        const cohortIdFromMeta =
          row?.metadata?.cohortId || row?.metadata?.cohort?._id || null;
        if (!cohortIdFromMeta) {
          skipped += 1;
          continue;
        }
        const cohort = await Cohort.findById(cohortIdFromMeta).lean();
        if (!dryRun) {
          await CohortInvitation.create({
            cohortId: cohortIdFromMeta,
            organizationId: cohort?.organizationId || row?.metadata?.organizationId,
            founderId: row.founderId || null,
            email: row.email || "",
            message: row.message || "",
            token: row.token || `legacy-${row._id}`,
            status:
              row.status === "accepted" || row.status === "declined"
                ? row.status
                : "pending",
            metadata: {
              ...(row.metadata || {}),
              migratedFrom: "FounderTalentInvitation",
              originalId: String(row._id),
            },
          });
        }
        migrated += 1;
      } catch (err) {
        errors.push({ id: String(row._id), message: err.message });
      }
    }

    return apiSuccess(res, {
      migration: "fix-org-invitations",
      total: legacy.length,
      migrated,
      skipped,
      errors,
      dryRun,
    });
  }),
);

/**
 * Backfill CohortMembership.joinedAt for rows that pre-date the field.
 * Idempotent.
 */
migrationsRouter.post(
  "/migrations/fix-cohort-memberships",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const dryRun = Boolean(req.body?.dryRun);
    const missing = await CohortMembership.find({
      $or: [{ joinedAt: { $exists: false } }, { joinedAt: null }],
    }).lean();
    let migrated = 0;
    for (const row of missing) {
      if (!dryRun) {
        await CohortMembership.updateOne(
          { _id: row._id },
          { $set: { joinedAt: row.createdAt || new Date() } },
        );
      }
      migrated += 1;
    }
    return apiSuccess(res, {
      migration: "fix-cohort-memberships",
      total: missing.length,
      migrated,
      dryRun,
    });
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
