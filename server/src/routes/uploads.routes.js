import { Router } from "express";
import multer from "multer";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { uploadBuffer } from "../services/uploadService.js";
import {
  getMaxUploadBytesForScope,
  isAllowedMessagesMime,
} from "../utils/messageAttachments.js";
import {
  isAllowedResumeMime,
  isResumeScope,
} from "../utils/resumeAttachments.js";
import {
  isAllowedAvatarMime,
  isAvatarScope,
} from "../utils/avatarAttachments.js";

const MESSAGES_MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MESSAGES_MAX_UPLOAD_BYTES },
});

const uploadsRouter = Router();

function handleMulter(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return apiError(
          res,
          "File is too large. Maximum is 40MB for chat attachments or 10MB for other uploads.",
          413,
        );
      }
      return apiError(res, err.message || "Upload failed.", 400);
    }
    return next();
  });
}

uploadsRouter.post(
  "/uploads",
  requireAuth,
  handleMulter,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return apiError(res, "file is required.", 400);
    }
    const scope = typeof req.body?.scope === "string" ? req.body.scope.trim() : "";
    const maxBytes = getMaxUploadBytesForScope(scope);
    if (req.file.size > maxBytes) {
      const limitMb = Math.round(maxBytes / (1024 * 1024));
      const msg =
        scope === "messages"
          ? `File is too large. Maximum is ${limitMb}MB for chat attachments.`
          : `File is too large. Maximum is ${limitMb}MB.`;
      return apiError(res, msg, 413);
    }
    if (scope === "messages" && !isAllowedMessagesMime(req.file.mimetype)) {
      return apiError(
        res,
        "File type not allowed for chat. Use images, videos, PDF, or documents.",
        400,
      );
    }
    if (isResumeScope(scope) && !isAllowedResumeMime(req.file.mimetype)) {
      return apiError(
        res,
        "Resume must be a PDF or DOCX file (max 5MB).",
        400,
      );
    }
    if (isAvatarScope(scope) && !isAllowedAvatarMime(req.file.mimetype)) {
      return apiError(
        res,
        "Avatar must be a JPEG, PNG, WebP, or GIF image (max 2MB).",
        400,
      );
    }
    const result = await uploadBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      scope: req.body?.scope,
    });
    return apiSuccess(res, result, 201);
  }),
);

export default uploadsRouter;
