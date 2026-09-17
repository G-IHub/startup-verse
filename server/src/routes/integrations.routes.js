import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import {
  listIntegrations,
  connectGmail,
  disconnectGmail,
  sendOutreachEmail,
  sendOutreachSequence,
  getEmailHistory,
  connectWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppOutreach,
  connectSocial,
  disconnectSocial,
  linkedInOAuthStart,
  linkedInOAuthCallback,
  postToLinkedIn,
  disconnectLinkedIn,
} from "../controllers/integrations.controller.js";

const integrationsRouter = Router();

integrationsRouter.get("/founders/:founderId/integrations", requireAuth, asyncHandler(listIntegrations));
integrationsRouter.post("/founders/:founderId/integrations/gmail/connect", requireAuth, asyncHandler(connectGmail));
integrationsRouter.delete("/founders/:founderId/integrations/gmail", requireAuth, asyncHandler(disconnectGmail));
integrationsRouter.post("/founders/:founderId/integrations/email/send", requireAuth, asyncHandler(sendOutreachEmail));
integrationsRouter.post("/founders/:founderId/integrations/email/sequence", requireAuth, asyncHandler(sendOutreachSequence));
integrationsRouter.get("/founders/:founderId/integrations/email/history", requireAuth, asyncHandler(getEmailHistory));

// WhatsApp
integrationsRouter.post("/founders/:founderId/integrations/whatsapp/connect", requireAuth, asyncHandler(connectWhatsApp));
integrationsRouter.delete("/founders/:founderId/integrations/whatsapp", requireAuth, asyncHandler(disconnectWhatsApp));
integrationsRouter.post("/founders/:founderId/integrations/whatsapp/send", requireAuth, asyncHandler(sendWhatsAppOutreach));

// Social profiles (Instagram, Facebook) — manual / copy mode
integrationsRouter.post("/founders/:founderId/integrations/social/connect", requireAuth, asyncHandler(connectSocial));
integrationsRouter.delete("/founders/:founderId/integrations/social/:type", requireAuth, asyncHandler(disconnectSocial));

// LinkedIn — real OAuth posting
integrationsRouter.get("/founders/:founderId/integrations/linkedin/oauth/start", requireAuth, asyncHandler(linkedInOAuthStart));
integrationsRouter.get("/integrations/linkedin/oauth/callback", asyncHandler(linkedInOAuthCallback));
integrationsRouter.post("/founders/:founderId/integrations/linkedin/post", requireAuth, asyncHandler(postToLinkedIn));
integrationsRouter.delete("/founders/:founderId/integrations/linkedin", requireAuth, asyncHandler(disconnectLinkedIn));

export default integrationsRouter;
