import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as eventsController from "../controllers/events.controller.js";

const eventsRouter = Router();

eventsRouter.get("/events/upcoming", requireAuth, asyncHandler(eventsController.listUpcomingEvents));
eventsRouter.post("/events/:eventId/rsvp", requireAuth, asyncHandler(eventsController.rsvpEvent));

export default eventsRouter;
