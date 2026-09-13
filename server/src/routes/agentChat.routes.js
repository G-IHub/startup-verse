import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as agentChatController from "../controllers/agentChat.controller.js";

const agentChatRouter = Router();

// Scoped to AI Product Manager only for now — see agentChat.controller.js.
agentChatRouter.get("/founders/:founderId/agent-chat/pm/messages", requireAuth, asyncHandler(agentChatController.listMessages));
agentChatRouter.post("/founders/:founderId/agent-chat/pm/messages", requireAuth, asyncHandler(agentChatController.sendMessage));
agentChatRouter.get("/founders/:founderId/agent-chat/pm/conversations", requireAuth, asyncHandler(agentChatController.listConversations));

export default agentChatRouter;
