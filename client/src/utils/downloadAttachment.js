import { API_BASE_URL } from "../config/apiBase.js";

/**
 * Download a file through an authenticated API URL (cookies included).
 * Use for /attachments/delivery proxy links that require auth.
 */
export async function downloadAttachmentWithAuth(url, fileName = "download") {
  const res = await fetch(url, { credentials: "include" });
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    if (contentType.includes("application/json")) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.message || res.statusText || "Download failed.");
    }
    throw new Error(res.statusText || "Download failed.");
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

export function isProxiedAttachmentUrl(url) {
  return (
    typeof url === "string" &&
    url.includes(`${API_BASE_URL}/attachments/delivery`)
  );
}
