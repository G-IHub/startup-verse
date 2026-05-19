import { saveBufferToDisk, getUploadRoot } from "./storage.js";
import {
  getCloudinary,
  isCloudinaryConfigured,
} from "../config/cloudinary.js";
import { logger } from "../config/logger.js";

// Scopes are reused as Cloudinary folder segments and disk sub-directories.
// Allow only safe identifier characters so the value can never escape the
// configured storage root (no leading dots, slashes, etc.).
const SCOPE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;

function resolveDriver() {
  const explicit = (process.env.STORAGE_DRIVER || "").trim().toLowerCase();
  if (explicit === "cloudinary" || explicit === "disk") return explicit;
  return isCloudinaryConfigured() ? "cloudinary" : "disk";
}

function normalizeScope(scope) {
  const raw = typeof scope === "string" ? scope.trim() : "";
  if (!raw) return "general";
  return SCOPE_PATTERN.test(raw) ? raw : "general";
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

async function uploadViaDisk({ buffer, mimeType, originalName, scope }) {
  const { key } = await saveBufferToDisk({
    buffer,
    originalName,
    subdir: scope,
  });
  return {
    url: `/uploads/${key}`,
    key,
    mimeType: mimeType || "application/octet-stream",
    size: buffer.length,
  };
}

/**
 * Persist an in-memory buffer through the configured storage driver and
 * return the canonical reference shape `{ url, key, mimeType, size }`.
 *
 * Driver dispatch is lazy (env read per call) so tests can flip
 * `STORAGE_DRIVER` per suite without restarting the process.
 */
export async function uploadBuffer({ buffer, mimeType, originalName, scope }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("uploadBuffer: buffer is required");
  }
  const scopeNorm = normalizeScope(scope);
  const driver = resolveDriver();
  logger.info("upload.start", {
    driver,
    scope: scopeNorm,
    mimeType: mimeType || null,
    size: buffer.length,
  });
  if (driver === "cloudinary") {
    return uploadViaCloudinary({
      buffer,
      mimeType,
      originalName,
      scope: scopeNorm,
    });
  }
  return uploadViaDisk({ buffer, mimeType, originalName, scope: scopeNorm });
}

export { getUploadRoot };
