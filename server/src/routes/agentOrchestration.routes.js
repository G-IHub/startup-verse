import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as agentOrchestrationController from "../controllers/agentOrchestration.controller.js";

const agentOrchestrationRouter = Router();

agentOrchestrationRouter.get("/founders/:founderId/agents", requireAuth, asyncHandler(agentOrchestrationController.listAgents));
agentOrchestrationRouter.get("/founders/:founderId/action-types", requireAuth, asyncHandler(agentOrchestrationController.listActionTypes));
agentOrchestrationRouter.get("/founders/:founderId/autonomy-settings", requireAuth, asyncHandler(agentOrchestrationController.listAutonomySettings));
agentOrchestrationRouter.patch("/founders/:founderId/action-types/:actionTypeId/autonomy", requireAuth, asyncHandler(agentOrchestrationController.updateAutonomySetting));
agentOrchestrationRouter.get("/founders/:founderId/agent-events", requireAuth, asyncHandler(agentOrchestrationController.listAgentEvents));
agentOrchestrationRouter.post("/founders/:founderId/agent-events/propose", requireAuth, asyncHandler(agentOrchestrationController.proposeAgentAction));
agentOrchestrationRouter.post("/agent-events/:eventId/resolve", requireAuth, asyncHandler(agentOrchestrationController.resolveAgentEvent));
agentOrchestrationRouter.get("/founders/:founderId/autonomous-planning", requireAuth, asyncHandler(agentOrchestrationController.getAutonomousPlanningSetting));
agentOrchestrationRouter.put("/founders/:founderId/autonomous-planning", requireAuth, asyncHandler(agentOrchestrationController.updateAutonomousPlanningSetting));

export default agentOrchestrationRouter;
