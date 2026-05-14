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
export async function uploadFile(file, scope = "general") {
  if (!file) {
    throw new Error("uploadFile: file is required");
  }
  const form = new FormData();
  form.append("file", file);
  if (scope) form.append("scope", String(scope));

  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      json?.message || json?.error || res.statusText || "Upload failed.";
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return unwrapData(json);
}
