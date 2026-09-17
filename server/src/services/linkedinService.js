import Integration from "../models/Integration.js";
import { logger } from "../config/logger.js";

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI ||
  "http://localhost:5000/api/v1/integrations/linkedin/oauth/callback";

export const isConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

export function buildAuthUrl(founderId) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: String(founderId),
    scope: "openid profile w_member_social",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeCode(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${text}`);
  }
  return res.json();
}

export async function getUserInfo(accessToken) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("LinkedIn userinfo request failed.");
  const d = await res.json();
  return {
    personUrn: `urn:li:person:${d.sub}`,
    displayName: [d.given_name, d.family_name].filter(Boolean).join(" ") || d.name || "LinkedIn",
    picture: d.picture || "",
  };
}

export async function publishPost(founderId, text) {
  const integration = await Integration.findOne({ founderId, type: "linkedin", status: "connected" });
  if (!integration?.credentials?.accessToken) {
    throw new Error("LinkedIn not connected. Connect LinkedIn from the Integrations page first.");
  }

  const { accessToken } = integration.credentials;
  const personUrn = integration.meta?.personUrn;
  if (!personUrn) throw new Error("LinkedIn person URN missing. Please reconnect LinkedIn.");

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202408",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error("linkedin.post.failed", { founderId, status: res.status, body });
    if (res.status === 401) throw new Error("LinkedIn token expired. Please reconnect LinkedIn.");
    throw new Error(`LinkedIn post failed (${res.status}). Check your connection and try again.`);
  }

  await Integration.findOneAndUpdate({ founderId, type: "linkedin" }, { lastUsedAt: new Date() });

  const postId = res.headers.get("x-restli-id") || "";
  return { postId };
}
