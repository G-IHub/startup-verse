import { Router } from "express";
import { success as apiSuccess } from "../utils/apiResponse.js";

const healthRouter = Router();

healthRouter.get("/health", (req, res) => {
  return apiSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    requestId: req.id || null,
  });
});

export default healthRouter;

