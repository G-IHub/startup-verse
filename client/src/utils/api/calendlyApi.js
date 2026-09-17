import { request } from "../backendClient";

export async function getCalendlyAuthorizeUrl() {
  const payload = await request("/calendly/oauth/authorize", { method: "GET" });
  return payload?.data || payload || {};
}

export async function getCalendlyConnection(founderId) {
  const payload = await request(`/founders/${founderId}/calendly`, { method: "GET" });
  return payload?.data || payload || { connected: false, configured: true, bookingUrl: "" };
}

export async function disconnectCalendly(founderId) {
  const payload = await request(`/founders/${founderId}/calendly`, { method: "DELETE" });
  return payload?.data || payload;
}
