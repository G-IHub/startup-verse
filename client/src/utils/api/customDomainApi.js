/**
 * Real custom-domain API (2026-09-15, Part 3) — backed by
 * customDomain.controller.js / railwayAdapter.js. See CustomDomain.js for
 * the data shape. Gated server-side behind real Railway credentials
 * (`railwayConfigured` in every response) — the UI must show an honest
 * "not set up yet" state when that's false, same pattern as GitHub OAuth's
 * `configured` flag elsewhere in this file's sibling API.
 */
import { request } from "../backendClient";

export async function getCustomDomain(founderId) {
  const payload = await request(`/founders/${founderId}/custom-domain`);
  return payload.data;
}

export async function createCustomDomain(founderId, domain) {
  const payload = await request(`/founders/${founderId}/custom-domain`, {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
  return payload.data;
}

export async function refreshCustomDomainStatus(founderId) {
  const payload = await request(`/founders/${founderId}/custom-domain/refresh`, { method: "POST" });
  return payload.data;
}

export async function deleteCustomDomain(founderId) {
  const payload = await request(`/founders/${founderId}/custom-domain`, { method: "DELETE" });
  return payload.data;
}
