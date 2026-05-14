import { Router } from "express";
import multer from "multer";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { uploadBuffer } from "../services/uploadService.js";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const uploadsRouter = Router();

// Map multer's typed errors onto our standard `apiError` envelope so the
// client sees a consistent shape (status + message) regardless of whether
// the file was too big or the request body was malformed.
function handleMulter(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return apiError(res, "File is too large. Maximum is 10MB.", 413);
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
