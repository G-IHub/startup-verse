import { v2 as cloudinary } from "cloudinary";

let configured = false;

/**
 * Returns true when enough environment is present to talk to Cloudinary.
 * Honors either the single `CLOUDINARY_URL` form
 * (`cloudinary://<key>:<secret>@<cloud_name>`) or the split credential form.
 */
export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET),
  );
}

/**
 * Returns the configured Cloudinary SDK singleton. Lazy so importing this
 * module doesn't throw or talk to Cloudinary at process start; callers only
 * pay the config cost on first upload.
 */
export function getCloudinary() {
  if (!configured) {
    if (!isCloudinaryConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.",
      );
    }
    if (!process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
    configured = true;
  }
  return cloudinary;
}
