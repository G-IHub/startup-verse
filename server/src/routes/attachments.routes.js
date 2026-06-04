import { Router } from "express";
import https from "https";
import http from "http";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import { error as apiError } from "../utils/apiResponse.js";
import { getCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { getUploadRoot } from "../services/storage.js";
import fs from "fs/promises";
import path from "path";

const attachmentsRouter = Router();

function isAllowedAttachmentUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/")) return true;
  if (trimmed.includes("/uploads/")) return true;
  if (/^https:\/\/res\.cloudinary\.com\//i.test(trimmed)) return true;
  return false;
}

function toDiskRelativePath(url) {
  if (url.startsWith("/uploads/")) return url;
  const match = url.match(/(\/uploads\/[^\?#]+)/);
  return match?.[1] || "";
}

function extractCloudinaryParts(url) {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const typeIdx = segments.findIndex((part) =>
      ["image", "raw", "video"].includes(part),
    );
    if (typeIdx === -1) return null;
    const resourceType = segments[typeIdx];
    const deliveryType = segments[typeIdx + 1] || "upload";
    let rest = segments.slice(typeIdx + 2);
    let version = null;
    if (rest[0]?.match(/^v(\d+)$/)) {
      version = Number(rest[0].slice(1));
      rest = rest.slice(1);
    }
    const publicIdWithExt = rest.join("/");
    const dotIdx = publicIdWithExt.lastIndexOf(".");
    const publicId =
      dotIdx > 0 ? publicIdWithExt.slice(0, dotIdx) : publicIdWithExt;
    const format = dotIdx > 0 ? publicIdWithExt.slice(dotIdx + 1) : "";
    return { resourceType, deliveryType, publicId, format, version };
  } catch {
    return null;
  }
}

function downloadBufferFromUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Too many redirects."));
      return;
    }
    const client = url.startsWith("https://") ? https : http;
    client
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          downloadBufferFromUrl(res.headers.location, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Upstream HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function readDiskUpload(relativePath) {
  const key = relativePath.replace(/^\/uploads\//, "");
  const diskPath = path.join(getUploadRoot(), key);
  const normalizedRoot = path.resolve(getUploadRoot());
  const normalizedFile = path.resolve(diskPath);
  if (!normalizedFile.startsWith(normalizedRoot)) {
    throw new Error("Invalid upload path.");
  }
  return fs.readFile(normalizedFile);
}

async function downloadFromCloudinary(parts, disposition) {
  const cloudinary = getCloudinary();
  const resourceTypes = [...new Set([parts.resourceType, "raw", "image"])];
  const errors = [];

  for (const resourceType of resourceTypes) {
    try {
      const downloadUrl = cloudinary.utils.private_download_url(
        parts.publicId,
        parts.format || "pdf",
        {
          resource_type: resourceType,
          type: parts.deliveryType,
          attachment: disposition === "attachment",
          ...(parts.version ? { version: parts.version } : {}),
        },
      );
      const buffer = await downloadBufferFromUrl(downloadUrl);
      const contentType =
        parts.format === "pdf"
          ? "application/pdf"
          : "application/octet-stream";
      return { buffer, contentType };
    } catch (err) {
      errors.push(`private_download/${resourceType}: ${err?.message || "failed"}`);
    }

    try {
      const signedUrl = cloudinary.url(parts.publicId, {
        resource_type: resourceType,
        type: parts.deliveryType,
        secure: true,
        sign_url: true,
        format: parts.format || undefined,
        ...(parts.version ? { version: parts.version } : {}),
        ...(disposition === "attachment" ? { flags: "attachment" } : {}),
      });
      const buffer = await downloadBufferFromUrl(signedUrl);
      return {
        buffer,
        contentType:
          parts.format === "pdf"
            ? "application/pdf"
            : "application/octet-stream",
      };
    } catch (err) {
      errors.push(`signed_url/${resourceType}: ${err?.message || "failed"}`);
    }
  }

  throw new Error(errors.join("; ") || "Cloudinary download failed.");
}

attachmentsRouter.get(
  "/attachments/delivery",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawUrl = String(req.query.url || "").trim();
    const fileName = String(req.query.fileName || "attachment").trim();
    const disposition = req.query.disposition === "inline" ? "inline" : "attachment";

    if (!isAllowedAttachmentUrl(rawUrl)) {
      return apiError(res, "Invalid attachment URL.", 400);
    }

    let buffer;
    let contentType = String(req.query.mimeType || "application/octet-stream");

    try {
      if (rawUrl.startsWith("/uploads/") || rawUrl.includes("/uploads/")) {
        const diskPath = toDiskRelativePath(rawUrl);
        if (!diskPath) return apiError(res, "Invalid upload path.", 400);
        buffer = await readDiskUpload(diskPath);
      } else if (rawUrl.includes("res.cloudinary.com") && isCloudinaryConfigured()) {
        const parts = extractCloudinaryParts(rawUrl);
        if (!parts) return apiError(res, "Unable to parse Cloudinary URL.", 400);
        const result = await downloadFromCloudinary(parts, disposition);
        buffer = result.buffer;
        contentType = result.contentType;
      } else {
        buffer = await downloadBufferFromUrl(rawUrl);
      }
    } catch (err) {
      return apiError(
        res,
        err?.message || "Unable to fetch attachment.",
        502,
      );
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${fileName.replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.send(buffer);
  }),
);

export default attachmentsRouter;
