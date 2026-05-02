import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { logger } from "../config/logger.js";

const ROOT_DIR =
  process.env.UPLOAD_ROOT_DIR || path.join(process.cwd(), "uploads", "data");

/**
 * Persist a binary asset on the local filesystem (dev / single-node deployments).
 * Set UPLOAD_ROOT_DIR and serve that directory statically from the API if you
 * need public URLs.
 *
 * @param {{ buffer: Buffer; originalName?: string; subdir?: string }} opts
 * @returns {Promise<{ diskPath: string; key: string }>}
 */
export async function saveBufferToDisk(opts) {
  const { buffer, originalName = "file", subdir = "misc" } = opts || {};
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("saveBufferToDisk: buffer required");
  }
  const dir = path.join(ROOT_DIR, subdir.replace(/^\//, ""));
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(originalName) || "";
  const key = `${subdir}/${randomUUID()}${ext}`;
  const diskPath = path.join(ROOT_DIR, key);
  await fs.writeFile(diskPath, buffer);
  logger.info("storage.saved", { key, bytes: buffer.length });
  return { diskPath, key };
}

export function getUploadRoot() {
  return ROOT_DIR;
}
