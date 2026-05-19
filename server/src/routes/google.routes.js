import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import { success as apiSuccess, error as apiError } from "../utils/apiResponse.js";
import {
  getGoogleOAuthMisconfigMessage,
  getGoogleOAuthConfig,
  getSettingsRedirectUrl,
  isGoogleIntegrationEnabled,
} from "../config/googleIntegration.js";
import {
  disconnectUser,
  getAuthorizationUrl,
  getConnectionStatus,
  handleOAuthCallback,
} from "../services/googleOAuthService.js";
import {
  createInstantMeet,
  createMeetingWithMeet,
} from "../services/googleMeetService.js";
import { logger } from "../config/logger.js";

const googleRouter = Router();

function integrationUnavailable(res) {
  const message = getGoogleOAuthMisconfigMessage();
  const status = isGoogleIntegrationEnabled() ? 503 : 503;
  return apiError(res, message, status);
}

async function redirectToGoogle(req, res) {
  if (!isGoogleIntegrationEnabled()) {
    return integrationUnavailable(res);
  }
  const cfg = getGoogleOAuthConfig();
  if (!cfg.configured) {
    return integrationUnavailable(res);
  }
  try {
    const url = getAuthorizationUrl(req.user.id);
    return res.redirect(url);
  } catch (err) {
    logger.error("Google OAuth authorize failed.", {
      error: err instanceof Error ? err.message : String(err),
    });
    return res.redirect(
      getSettingsRedirectUrl({ google: "error", message: "authorize_failed" }),
    );
  }
}

googleRouter.get(
  "/google/status/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(async (req, res) => {
    const status = await getConnectionStatus(req.params.userId);
    return apiSuccess(res, status);
  }),
);

googleRouter.get(
  "/google/connect",
  requireAuth,
  asyncHandler(redirectToGoogle),
);

googleRouter.get(
  "/google/oauth/authorize",
  requireAuth,
  asyncHandler(redirectToGoogle),
);

googleRouter.get(
  "/google/oauth/callback",
  asyncHandler(async (req, res) => {
    const { code, state, error: oauthError } = req.query;
    if (oauthError) {
      return res.redirect(
        getSettingsRedirectUrl({
          google: "error",
          message: String(oauthError),
        }),
      );
    }
    if (!code || !state) {
      return res.redirect(
        getSettingsRedirectUrl({ google: "error", message: "missing_code" }),
      );
    }
    if (!isGoogleIntegrationEnabled()) {
      return res.redirect(
        getSettingsRedirectUrl({ google: "error", message: "disabled" }),
      );
    }
    try {
      await handleOAuthCallback(String(code), String(state));
      return res.redirect(getSettingsRedirectUrl({ google: "connected" }));
    } catch (err) {
      logger.error("Google OAuth callback failed.", {
        error: err instanceof Error ? err.message : String(err),
      });
      return res.redirect(
        getSettingsRedirectUrl({
          google: "error",
          message: "callback_failed",
        }),
      );
    }
  }),
);

googleRouter.post(
  "/google/create-meeting",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isGoogleIntegrationEnabled()) {
      return integrationUnavailable(res);
    }
    const cfg = getGoogleOAuthConfig();
    if (!cfg.configured) {
      return integrationUnavailable(res);
    }
    try {
      const result = await createMeetingWithMeet(req.user.id, req.body || {});
      return apiSuccess(res, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Meet creation failed.";
      const status = message.includes("not connected") ? 403 : 502;
      return apiError(res, message, status);
    }
  }),
);

googleRouter.post(
  "/google/instant-meeting/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(async (req, res) => {
    if (!isGoogleIntegrationEnabled()) {
      return integrationUnavailable(res);
    }
    const cfg = getGoogleOAuthConfig();
    if (!cfg.configured) {
      return integrationUnavailable(res);
    }
    const title =
      typeof req.body?.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : typeof req.body?.roomName === "string" && req.body.roomName.trim()
          ? req.body.roomName.trim()
          : "StartupVerse Meeting";
    try {
      const result = await createInstantMeet(req.params.userId, { title });
      return apiSuccess(res, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Instant Meet failed.";
      const status = message.includes("not connected") ? 403 : 502;
      return apiError(res, message, status);
    }
  }),
);

googleRouter.post(
  "/google/disconnect/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(async (req, res) => {
    const result = await disconnectUser(req.params.userId);
    return apiSuccess(res, {
      provider: "google",
      userId: req.params.userId,
      disconnected: result.disconnected,
      placeholder: false,
    });
  }),
);

googleRouter.delete(
  "/google/disconnect/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(async (req, res) => {
    const result = await disconnectUser(req.params.userId);
    return apiSuccess(res, {
      provider: "google",
      userId: req.params.userId,
      disconnected: result.disconnected,
      placeholder: false,
    });
  }),
);

export default googleRouter;
