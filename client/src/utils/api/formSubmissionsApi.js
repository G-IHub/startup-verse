/**
 * Real form-submission read API (2026-09-15) — the founder-facing
 * counterpart to hostedSitePublic.js's public capture endpoint. See
 * server/src/models/FormSubmission.js.
 */
import { request } from "../backendClient";

export async function getFormSubmissions(founderId) {
  const payload = await request(`/founders/${founderId}/form-submissions`);
  return payload.data;
}
