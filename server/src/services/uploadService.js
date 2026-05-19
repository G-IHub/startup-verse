import {
  getCloudinary,
  isCloudinaryConfigured,
} from "../config/cloudinary.js";
import { logger } from "../config/logger.js";

// Scopes map to Cloudinary folder segments (`startupverse/<scope>`).
const SCOPE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;

export function normalizeUploadScope(scope) {
  const raw = typeof scope === "string" ? scope.trim() : "";
  if (!raw) return "general";
  return SCOPE_PATTERN.test(raw) ? raw : "general";
}

function assertCloudinaryReady() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
}

async function uploadViaCloudinary({ buffer, mimeType, originalName, scope }) {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `startupverse/${scope}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName || undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          key: result.public_id,
          mimeType:
            mimeType ||
            (result.resource_type
              ? `${result.resource_type}/${result.format || "octet-stream"}`
              : "application/octet-stream"),
          size: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Persist an in-memory buffer to Cloudinary and return
 * `{ url, key, mimeType, size }`.
 */
export async function uploadBuffer({ buffer, mimeType, originalName, scope }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("uploadBuffer: buffer is required");
  }
  assertCloudinaryReady();

  const scopeNorm = normalizeUploadScope(scope);
  logger.info("upload.start", {
    driver: "cloudinary",
    scope: scopeNorm,
    mimeType: mimeType || null,
    size: buffer.length,
  });

  return uploadViaCloudinary({
    buffer,
    mimeType,
    originalName,
    scope: scopeNorm,
  });
}
