/**
 * Email transport probe only. Product emails are sent from invitation/mentor
 * controllers via emailService (Step 2.11), not generic send-* routes here.
 */
import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import {
  isEmailDeliveryEnabled,
  resolveEmailDriver,
} from "../services/emailService.js";

const emailsRouter = Router();

emailsRouter.post(
  "/emails/test",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      sent: isEmailDeliveryEnabled(),
      transport: resolveEmailDriver(),
    });
  }),
);

export default emailsRouter;
