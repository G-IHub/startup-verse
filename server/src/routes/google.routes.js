import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess, error as apiError } from "../utils/apiResponse.js";
import { isGoogleIntegrationEnabled } from "../config/googleIntegration.js";

const googleRouter = Router();

const disabledMessage =
  "Google Calendar and Meet integration is turned off. Set GOOGLE_INTEGRATION_ENABLED=true when OAuth credentials are configured.";

googleRouter.get(
  "/google/status/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const enabled = isGoogleIntegrationEnabled();
    return apiSuccess(res, {
      userId: req.params.userId,
      enabled,
      connected: false,
      email: "",
      provider: "google",
      placeholder: true,
      message: enabled
        ? "OAuth flow not yet implemented on this server."
        : disabledMessage,
    });
  }),
);

googleRouter.get(
  "/google/oauth/authorize",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isGoogleIntegrationEnabled()) {
      return apiError(res, disabledMessage, 503);
    }
    return apiError(
      res,
      "Google OAuth authorize URL is not configured. Provide client credentials and implement the redirect.",
      501,
    );
  }),
);

googleRouter.get(
  "/google/oauth/callback",
  asyncHandler(async (req, res) => {
    if (!isGoogleIntegrationEnabled()) {
      return apiError(res, disabledMessage, 503);
    }
    return apiError(res, "Google OAuth callback handler not implemented.", 501);
  }),
);

googleRouter.post(
  "/google/create-meeting",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isGoogleIntegrationEnabled()) {
      return apiError(res, disabledMessage, 503);
    }
    return apiError(res, "Google Meet creation is not implemented.", 501);
  }),
);

googleRouter.post(
  "/google/instant-meeting/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isGoogleIntegrationEnabled()) {
      return apiError(res, disabledMessage, 503);
    }
    return apiError(res, "Instant Google Meet is not implemented.", 501);
  }),
);

googleRouter.post(
  "/google/disconnect/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      provider: "google",
      userId: req.params.userId,
      disconnected: true,
      placeholder: true,
    });
  }),
);

googleRouter.delete(
  "/google/disconnect/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      provider: "google",
      userId: req.params.userId,
      disconnected: true,
      placeholder: true,
    });
  }),
);

export default googleRouter;