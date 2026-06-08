import { API_BASE_URL } from "../../config/apiBase.js";
import { unwrapData } from "../apiEnvelope.js";

/**
 * Upload a single file through the StartupVerse `POST /uploads` endpoint.
 *
 * Scope namespaces the storage location (Cloudinary folder or disk subdir):
 * - `general` (default)
 * - `org-logo`, `messages`, `resources`, `deliverables`, `announcements`, ...
 *
 * The server enforces auth and a 10MB max file size. On 4xx/5xx we throw a
 * standard `Error` whose `status` field carries the HTTP code so callers can
 * branch on it (this matches the contract the Step 1.13 `apiClient` will use,
 * which will eventually replace this raw `fetch` call).
 *
 * @param {File|Blob} file - the file to upload
 * @param {string} [scope] - storage namespace
 * @returns {Promise<{ url: string; key: string; mimeType: string; size: number }>}
 */
function parseUploadResponse(xhr) {
  let json = {};
  try {
    json = JSON.parse(xhr.responseText || "{}");
  } catch {
    json = {};
  }
  if (xhr.status >= 200 && xhr.status < 300) {
    return unwrapData(json);
  }
  const message =
    json?.message || json?.error || xhr.statusText || "Upload failed.";
  const err = new Error(message);
  err.status = xhr.status;
  throw err;
}

/**
 * Upload with progress events (0–100). Used by chat composer.
 */
export function uploadFileWithProgress(file, scope = "general", onProgress) {
  if (!file) {
    return Promise.reject(new Error("uploadFileWithProgress: file is required"));
  }
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (scope) form.append("scope", String(scope));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/uploads`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== "function") return;
      const pct = Math.round((event.loaded / event.total) * 100);
      onProgress(pct);
    };

    xhr.onload = () => {
      try {
        resolve(parseUploadResponse(xhr));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(form);
  });
}

export async function uploadFile(file, scope = "general") {
  return uploadFileWithProgress(file, scope);
}
