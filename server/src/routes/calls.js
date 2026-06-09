import { Router } from "express";
import {
  createCall,
  endCall,
  getActiveCalls,
  joinCall,
} from "../controllers/callsController.js";
import requireAuth from "../middleware/requireAuth.js";

const callsRouter = Router();

callsRouter.post("/create", requireAuth, createCall);
callsRouter.post("/join/:roomName", requireAuth, joinCall);
callsRouter.get("/active", requireAuth, getActiveCalls);
callsRouter.post("/end/:roomName", requireAuth, endCall);

export default callsRouter;
