import { API_BASE_URL } from "../config/apiBase.js";
import { inferAttachmentKind } from "./messageAttachmentUtils.js";

/** API origin without the `/api/v1` suffix (static `/uploads` is mounted at server root). */
function getUploadsOrigin() {
  const explicit = import.meta.env.VITE_UPLOADS_ORIGIN;
  if (explicit && typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, "");
  }
  const base = API_BASE_URL.replace(/\/api\/v\d+\/?$/i, "");
  return base || API_BASE_URL;
}

/**
 * Turn stored attachment URLs into browser-loadable absolute URLs.
 * Cloudinary URLs pass through; disk driver returns `/uploads/...` paths.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `${window.location.protocol}${trimmed}`;
  }
  const origin = getUploadsOrigin();
  if (trimmed.startsWith("/")) {
    return `${origin}${trimmed}`;
  }
  return `${origin}/${trimmed}`;
}

/**
 * Build a download URL for PDFs/docs. Routes through the authenticated API proxy
 * so Cloudinary delivery restrictions (401) are avoided.
 */
export function resolveAttachmentDeliveryUrl(
  url,
  { fileName = "", fileType = "", disposition = "attachment" } = {},
) {
  const absolute = resolveMediaUrl(url);
  if (!absolute) return "";

  const kind = inferAttachmentKind(fileType, fileName);
  const isCloudinary = absolute.includes("res.cloudinary.com");
  const needsProxy = kind === "pdf" || kind === "file" || isCloudinary;

  if (!needsProxy) return absolute;

  const storedUrl =
    url.startsWith("http") || url.startsWith("/") ? url : absolute;

  const params = new URLSearchParams({
    url: storedUrl,
    fileName: fileName || "attachment",
    disposition,
  });
  if (fileType) params.set("mimeType", fileType);
  return `${API_BASE_URL}/attachments/delivery?${params.toString()}`;
}

export default resolveMediaUrl;
