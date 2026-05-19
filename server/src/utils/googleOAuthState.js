/**
 * Signed OAuth state parameter (userId + expiry).
 */
import crypto from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret() {
  return (
    process.env.GOOGLE_OAUTH_STATE_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    ""
  );
}

export function signOAuthState(userId) {
  const secret = stateSecret();
  if (!secret) throw new Error("JWT_SECRET required for OAuth state signing.");
  const payload = {
    userId: String(userId),
    exp: Date.now() + STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(state) {
  const secret = stateSecret();
  if (!secret || !state || typeof state !== "string") {
    return { ok: false, message: "Invalid OAuth state." };
  }
  const [body, sig] = state.split(".");
  if (!body || !sig) return { ok: false, message: "Malformed OAuth state." };
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  if (sig.length !== expected.length) {
    return { ok: false, message: "Invalid OAuth state signature." };
  }
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { ok: false, message: "Invalid OAuth state signature." };
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, message: "Invalid OAuth state payload." };
  }
  if (!payload?.userId || typeof payload.exp !== "number") {
    return { ok: false, message: "Invalid OAuth state payload." };
  }
  if (Date.now() > payload.exp) {
    return { ok: false, message: "OAuth state expired. Try connecting again." };
  }
  return { ok: true, userId: String(payload.userId) };
}
