import { Router } from "express";
import multer from "multer";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as usersController from "../controllers/users.controller.js";
import { error as apiError } from "../utils/apiResponse.js";
import { getAvatarMaxBytes } from "../utils/avatarAttachments.js";

const usersRouter = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getAvatarMaxBytes() },
});

function handleAvatarMulter(req, res, next) {
  avatarUpload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return apiError(res, "Avatar must be 2MB or smaller.", 413);
      }
      return apiError(res, err.message || "Upload failed.", 400);
    }
    return next();
  });
}

// Blueprint §14: POST /api/v1/users/ — admin-only create user
usersRouter.post(
  "/users",
  requireAuth,
  asyncHandler(usersController.createUser)
);

usersRouter.get(
  "/users/:userId",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.getUserById)
);

usersRouter.post(
  "/users/search-by-email",
  requireAuth,
  asyncHandler(usersController.searchByEmail)
);

usersRouter.get(
  "/users/:userId/notifications",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.getNotifications)
);

usersRouter.delete(
  "/users/:userId/notifications",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.clearNotifications)
);

usersRouter.post(
  "/users/:userId/notifications/mark-all-read",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.markAllNotificationsRead)
);

usersRouter.get(
  "/users/:userId/notification-preferences",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.getNotificationPreferences)
);

usersRouter.put(
  "/users/:userId/notification-preferences",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.updateNotificationPreferences)
);

usersRouter.get(
  "/users/:userId/client-preferences",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.getClientPreferences)
);

usersRouter.put(
  "/users/:userId/client-preferences",
  requireAuth,
  requireSelfOrAdmin("userId"),
  asyncHandler(usersController.updateClientPreferences)
);

usersRouter.post(
  "/users/upload-avatar",
  requireAuth,
  handleAvatarMulter,
  asyncHandler(usersController.uploadAvatar)
);

usersRouter.post(
  "/upload-avatar",
  requireAuth,
  handleAvatarMulter,
  asyncHandler(usersController.uploadAvatar)
);

export default usersRouter;
