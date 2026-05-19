/**
 * Google OAuth2 token lifecycle (Calendar + Meet).
 */
import { google } from "googleapis";
import GoogleConnection from "../models/GoogleConnection.js";
import {
  getGoogleOAuthConfig,
  getGoogleScopes,
  isGoogleIntegrationEnabled,
} from "../config/googleIntegration.js";
import { encryptToken, decryptToken } from "../utils/tokenCipher.js";
import { signOAuthState, verifyOAuthState } from "../utils/googleOAuthState.js";
import { logger } from "../config/logger.js";

function buildOAuth2Client(cfg) {
  return new google.auth.OAuth2(
    cfg.clientId,
    cfg.clientSecret,
    cfg.redirectUri,
  );
}

async function fetchGoogleEmail(oauth2Client) {
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data?.email || "";
}

async function persistTokens(userId, tokens, email = "") {
  const accessToken = tokens.access_token || "";
  const refreshToken = tokens.refresh_token || "";
  const expiryDate = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : null;

  const update = {
    email: email || undefined,
    accessTokenEnc: accessToken ? encryptToken(accessToken) : "",
    expiryDate,
    scopes: getGoogleScopes(),
  };
  if (refreshToken) {
    update.refreshTokenEnc = encryptToken(refreshToken);
  }

  const existing = await GoogleConnection.findOne({ userId });
  if (existing && !refreshToken) {
    delete update.refreshTokenEnc;
  }

  return GoogleConnection.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { userId } },
    { upsert: true, new: true },
  );
}

export function getAuthorizationUrl(userId) {
  const cfg = getGoogleOAuthConfig();
  if (!cfg.configured) {
    throw new Error("Google OAuth is not configured.");
  }
  const client = buildOAuth2Client(cfg);
  const state = signOAuthState(userId);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: cfg.scopes,
    state,
  });
}

export async function handleOAuthCallback(code, state) {
  const verified = verifyOAuthState(state);
  if (!verified.ok) {
    throw new Error(verified.message);
  }
  const cfg = getGoogleOAuthConfig();
  if (!cfg.configured) {
    throw new Error("Google OAuth is not configured.");
  }
  const client = buildOAuth2Client(cfg);
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const email = await fetchGoogleEmail(client);
  await persistTokens(verified.userId, tokens, email);
  return { userId: verified.userId, email };
}

export async function getOAuth2ClientForUser(userId) {
  const cfg = getGoogleOAuthConfig();
  if (!cfg.configured) return null;

  const row = await GoogleConnection.findOne({ userId });
  if (!row?.refreshTokenEnc && !row?.accessTokenEnc) return null;

  const client = buildOAuth2Client(cfg);
  const refreshToken = row.refreshTokenEnc
    ? decryptToken(row.refreshTokenEnc)
    : "";
  const accessToken = row.accessTokenEnc
    ? decryptToken(row.accessTokenEnc)
    : "";

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: row.expiryDate ? row.expiryDate.getTime() : undefined,
  });

  client.on("tokens", async (tokens) => {
    try {
      await persistTokens(userId, {
        ...tokens,
        refresh_token: tokens.refresh_token || refreshToken,
      });
    } catch (err) {
      logger.error("Failed to persist refreshed Google tokens.", {
        userId: String(userId),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return client;
}

export async function getConnectionStatus(userId) {
  if (!isGoogleIntegrationEnabled()) {
    return {
      userId: String(userId),
      enabled: false,
      connected: false,
      email: "",
      provider: "google",
      placeholder: true,
      message:
        "Google Calendar and Meet integration is turned off. Set GOOGLE_INTEGRATION_ENABLED=true when OAuth credentials are configured.",
    };
  }

  const cfg = getGoogleOAuthConfig();
  if (!cfg.configured) {
    return {
      userId: String(userId),
      enabled: true,
      connected: false,
      email: "",
      provider: "google",
      placeholder: true,
      message: `Google OAuth is enabled but not configured (${cfg.missing.join(", ")}).`,
    };
  }

  const row = await GoogleConnection.findOne({ userId }).lean();
  const hasTokens = Boolean(row?.refreshTokenEnc || row?.accessTokenEnc);
  if (!hasTokens) {
    return {
      userId: String(userId),
      enabled: true,
      connected: false,
      email: "",
      provider: "google",
      placeholder: false,
      message: "Connect your Google account to use Calendar and Meet.",
    };
  }

  try {
    const client = await getOAuth2ClientForUser(userId);
    if (!client) {
      return {
        userId: String(userId),
        enabled: true,
        connected: false,
        email: "",
        provider: "google",
        placeholder: false,
      };
    }
    const email = row.email || (await fetchGoogleEmail(client));
    if (email && email !== row.email) {
      await GoogleConnection.updateOne({ userId }, { $set: { email } });
    }
    return {
      userId: String(userId),
      enabled: true,
      connected: true,
      email,
      provider: "google",
      placeholder: false,
    };
  } catch (err) {
    logger.warn("Google connection status check failed.", {
      userId: String(userId),
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      userId: String(userId),
      enabled: true,
      connected: false,
      email: row?.email || "",
      provider: "google",
      placeholder: false,
      message: "Google session expired. Please connect again.",
    };
  }
}

export async function disconnectUser(userId) {
  const row = await GoogleConnection.findOne({ userId });
  if (row?.accessTokenEnc || row?.refreshTokenEnc) {
    try {
      const cfg = getGoogleOAuthConfig();
      if (cfg.configured) {
        const client = buildOAuth2Client(cfg);
        const refreshToken = row.refreshTokenEnc
          ? decryptToken(row.refreshTokenEnc)
          : "";
        const accessToken = row.accessTokenEnc
          ? decryptToken(row.accessTokenEnc)
          : "";
        client.setCredentials({
          refresh_token: refreshToken,
          access_token: accessToken,
        });
        await client.revokeCredentials();
      }
    } catch (err) {
      logger.warn("Google revoke failed; deleting local tokens anyway.", {
        userId: String(userId),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  await GoogleConnection.deleteOne({ userId });
  return { disconnected: true };
}
