import { Router } from "express";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess } from "../utils/apiResponse.js";

const emailsRouter = Router();

emailsRouter.post(
  "/emails/test",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      sent: true,
      transport: "placeholder",
    });
  }),
);

emailsRouter.post(
  "/emails/send-invitation",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      sent: true,
      id: crypto.randomUUID(),
      payload: req.body || {},
    });
  }),
);

emailsRouter.post(
  "/emails/send-notification",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      sent: true,
      id: crypto.randomUUID(),
      payload: req.body || {},
    });
  }),
);

emailsRouter.post(
  "/emails/send-welcome",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      sent: true,
      id: crypto.randomUUID(),
      payload: req.body || {},
    });
  }),
);

export default emailsRouter;
