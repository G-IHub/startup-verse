import { Router } from "express";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import {
  isEmailDeliveryEnabled,
  sendEmail,
} from "../services/emailService.js";

const emailsRouter = Router();

emailsRouter.post(
  "/emails/test",
  requireAuth,
  asyncHandler(async (req, res) => {
    const configured = isEmailDeliveryEnabled();
    const to = req.user?.email;

    if (!configured) {
      return apiSuccess(res, {
        sent: false,
        configured: false,
        transport: "log_only",
        message:
          "Set EMAIL_TRANSPORT=smtp and SMTP_HOST, SMTP_USER, SMTP_PASS in server/.env (see server/.env.example for Mailtrap).",
      });
    }

    if (!to) {
      return apiSuccess(res, {
        sent: false,
        configured: true,
        message: "No email on your user account to send a test message.",
      });
    }

    const result = await sendEmail({
      to,
      subject: "StartupVerse — email test",
      text: "If you received this message, SMTP (Mailtrap) is configured correctly.",
      html: "<p>If you received this message, <strong>SMTP (Mailtrap)</strong> is configured correctly.</p>",
    });

    return apiSuccess(res, {
      sent: result.sent,
      configured: true,
      transport: result.mode,
      to,
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
      note: "Cohort invites send email automatically from POST /invitations/create.",
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
