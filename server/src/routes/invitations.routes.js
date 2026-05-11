import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as invitationsController from "../controllers/invitations.controller.js";

const invitationsRouter = Router();

invitationsRouter.post("/invitations/create", requireAuth, asyncHandler(invitationsController.createInvitation));
invitationsRouter.get("/invitations/founder/:founderId", requireAuth, asyncHandler(invitationsController.getFounderInvitations));
invitationsRouter.get("/invitations/token/:token", asyncHandler(invitationsController.getInvitationByToken));
invitationsRouter.post("/invitations/token/:token/accept", asyncHandler(invitationsController.acceptInvitationByToken));
invitationsRouter.post("/invitations/:invitationId/respond", requireAuth, asyncHandler(invitationsController.respondToInvitation));

invitationsRouter.post("/invitations/send", requireAuth, asyncHandler(invitationsController.sendFounderTalentInvitation));
invitationsRouter.get("/invitations/sent/:founderId", requireAuth, asyncHandler(invitationsController.getSentFounderTalentInvitations));
invitationsRouter.get("/invitations/received/:talentId", requireAuth, asyncHandler(invitationsController.getReceivedFounderTalentInvitations));
invitationsRouter.put("/invitations/:invitationId/status", requireAuth, asyncHandler(invitationsController.updateFounderTalentInvitationStatus));
invitationsRouter.post("/invitations/:invitationId/messages", requireAuth, asyncHandler(invitationsController.addMessageToFounderTalentInvitation));
invitationsRouter.post("/invitations/:invitationId/onboard", requireAuth, asyncHandler(invitationsController.onboardFounderTalentInvitation));

invitationsRouter.post("/interests/send", requireAuth, asyncHandler(invitationsController.createInterest));
invitationsRouter.get("/interests/received/:founderId", requireAuth, asyncHandler(invitationsController.getReceivedInterests));
invitationsRouter.get("/interests/sent/:talentId", requireAuth, asyncHandler(invitationsController.getSentInterests));
invitationsRouter.get("/interests/:interestId", requireAuth, asyncHandler(invitationsController.getInterestById));
invitationsRouter.put("/interests/:interestId/status", requireAuth, asyncHandler(invitationsController.updateInterestStatus));
invitationsRouter.post("/interests/:interestId/messages", requireAuth, asyncHandler(invitationsController.addMessageToInterest));
invitationsRouter.post("/interests/:interestId/onboard", requireAuth, asyncHandler(invitationsController.onboardInterest));

export default invitationsRouter;