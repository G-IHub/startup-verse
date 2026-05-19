/**
 * Google Calendar / Meet OAuth (Phase 9.1).
 * Disabled by default — set GOOGLE_INTEGRATION_ENABLED=true when credentials exist.
 */
import { publicAppUrl } from "../utils/publicAppUrl.js";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
];

export function isGoogleIntegrationEnabled() {
  return (
    String(process.env.GOOGLE_INTEGRATION_ENABLED || "")
      .trim()
      .toLowerCase() === "true"
  );
}

export function getGoogleScopes() {
  return [...SCOPES];
}

function defaultRedirectUri() {
  const port = process.env.PORT?.trim() || "5000";
  const nodeEnv = process.env.NODE_ENV?.trim() || "development";
  if (nodeEnv === "production") return "";
  return `http://localhost:${port}/api/v1/google/oauth/callback`;
}

/**
 * @returns {{ clientId: string, clientSecret: string, redirectUri: string, configured: boolean, missing: string[] }}
 */
export function getGoogleOAuthConfig() {
  const enabled = isGoogleIntegrationEnabled();
  const clientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const redirectUri = (
    String(process.env.GOOGLE_REDIRECT_URI || "").trim() || defaultRedirectUri()
  ).replace(/\/$/, "");

  const missing = [];
  if (enabled) {
    if (!clientId) missing.push("GOOGLE_CLIENT_ID");
    if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
    if (!redirectUri) missing.push("GOOGLE_REDIRECT_URI");
  }

  return {
    enabled,
    clientId,
    clientSecret,
    redirectUri,
    scopes: SCOPES,
    configured: enabled && missing.length === 0,
    missing,
  };
}

export function getGoogleOAuthMisconfigMessage() {
  const cfg = getGoogleOAuthConfig();
  if (!cfg.enabled) {
    return "Google Calendar and Meet integration is turned off. Set GOOGLE_INTEGRATION_ENABLED=true when OAuth credentials are configured.";
  }
  if (!cfg.configured) {
    return `Google OAuth is enabled but misconfigured. Set: ${cfg.missing.join(", ")}. See docs/GOOGLE_OAUTH_SETUP.md.`;
  }
  return "";
}

export function getSettingsRedirectUrl(query = {}) {
  const base = publicAppUrl() || "http://localhost:5173";
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return `${base}/settings${qs ? `?${qs}` : ""}`;
}
