import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as offersController from "../controllers/offers.controller.js";

const offersRouter = Router();

offersRouter.post("/offers", requireAuth, asyncHandler(offersController.createOffer));
offersRouter.get(
  "/founders/:founderId/offers",
  requireAuth,
  requireSelfOrAdmin("founderId"),
  asyncHandler(offersController.getSentOffers),
);
offersRouter.get(
  "/talent/:talentId/offers",
  requireAuth,
  requireSelfOrAdmin("talentId"),
  asyncHandler(offersController.getReceivedOffers),
);
offersRouter.put("/offers/:offerId/status", requireAuth, asyncHandler(offersController.updateOfferStatus));

export default offersRouter;
