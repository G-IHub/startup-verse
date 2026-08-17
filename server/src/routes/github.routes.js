import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as githubController from "../controllers/github.controller.js";

const githubRouter = Router();

githubRouter.get("/github/oauth/authorize", requireAuth, asyncHandler(githubController.authorize));
githubRouter.get("/github/oauth/callback", asyncHandler(githubController.callback));
githubRouter.get("/github/connection", requireAuth, asyncHandler(githubController.getConnection));
githubRouter.delete("/github/connection", requireAuth, asyncHandler(githubController.deleteConnection));
githubRouter.get("/github/repos", requireAuth, asyncHandler(githubController.listRepos));
githubRouter.get(
  "/github/repos/:owner/:repo/issues",
  requireAuth,
  asyncHandler(githubController.listIssues),
);
githubRouter.post("/github/import", requireAuth, asyncHandler(githubController.importIssues));

export default githubRouter;
