/**
 * Central JSON fetch wrapper for the StartupVerse client.
 *
 * Surfaces backend error envelope fields (`message`, `error`, `code`, `details`)
 * on the thrown Error so callers (and `toastError`) can react on `err.status`
 * without re-parsing strings.
 *
 * Behaviour:
 * - Defaults `credentials: "include"` so cookie-based auth works.
 * - Sends `Content-Type: application/json` by default, but skips it when the
 *   body is a `FormData` instance so the browser can set the multipart
 *   boundary automatically.
 * - Parses the response body as JSON, tolerating empty / non-JSON bodies.
 * - On non-2xx, throws an `Error` with `err.status`, `err.code`, `err.details`
 *   attached.
 * - On 2xx, returns `json.data` if present (matching the `apiSuccess` envelope
 *   used by the backend), otherwise the raw JSON.
 *
 * @param {string} url - absolute or API-relative URL
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiFetch(url, options = {}) {
  const isForm =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      json?.message || json?.error || res.statusText || "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.code = json?.code || null;
    err.details = json?.details || null;
    throw err;
  }

  return json?.data ?? json;
}

export default apiFetch;
