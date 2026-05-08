/**
 * Google Calendar / Meet OAuth is optional. When disabled (default), routes
 * return explicit payloads so the client can hide or message the feature.
 */
export function isGoogleIntegrationEnabled() {
  return String(process.env.GOOGLE_INTEGRATION_ENABLED || "")
    .trim()
    .toLowerCase() === "true";
}
