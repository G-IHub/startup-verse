import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { success as apiSuccess } from "../utils/apiResponse.js";

const googleRouter = Router();

googleRouter.get(
  "/google/status/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      userId: req.params.userId,
      connected: false,
      provider: "google",
      placeholder: true,
    });
  }),
);

googleRouter.get(
  "/google/oauth/authorize",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      provider: "google",
      placeholder: true,
      authorizationUrl: null,
      query: req.query,
    });
  }),
);

googleRouter.get(
  "/google/oauth/callback",
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      provider: "google",
      placeholder: true,
      callbackReceived: true,
      query: req.query,
    });
  }),
);

googleRouter.post(
  "/google/create-meeting",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      provider: "google",
      placeholder: true,
      meetingUrl: null,
      payload: req.body || {},
    });
  }),
);

googleRouter.post(
  "/google/instant-meeting/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    return apiSuccess(res, {
      provider: "google",
      placeholder: true,
      userId: req.params.userId,
      meetingUrl: null,
    });
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

export default googleRouter;