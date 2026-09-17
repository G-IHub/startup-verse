import crypto from "crypto";

function encryptionKey() {
  // Prefer a dedicated key; fall back to the shared GitHub key so founders
  // don't need a second env var just to try Calendly in local dev.
  const raw = String(
    process.env.CALENDLY_TOKEN_ENCRYPTION_KEY ||
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY ||
      "",
  ).trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "utf8");
  if (buf.length === 32) return buf;
  return crypto.createHash("sha256").update(raw).digest();
}

export function calendlyConfigured() {
  return Boolean(
    process.env.CALENDLY_CLIENT_ID &&
      process.env.CALENDLY_CLIENT_SECRET &&
      process.env.CALENDLY_REDIRECT_URI &&
      encryptionKey(),
  );
}

export function encryptCalendlyToken(plain) {
  const key = encryptionKey();
  if (!key) throw new Error("No encryption key configured for Calendly tokens.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptCalendlyToken(stored) {
  const key = encryptionKey();
  if (!key) throw new Error("No encryption key configured for Calendly tokens.");
  const [ivHex, tagHex, dataHex] = String(stored || "").split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function signOauthState(userId) {
  const secret = process.env.JWT_SECRET || process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  const exp = Date.now() + 10 * 60 * 1000;
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${userId}.${exp}.${nonce}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyOauthState(state) {
  const secret = process.env.JWT_SECRET || process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  const decoded = Buffer.from(String(state || ""), "base64url").toString("utf8");
  const parts = decoded.split(".");
  if (parts.length !== 4) return null;
  const [userId, exp, nonce, sig] = parts;
  const payload = `${userId}.${exp}.${nonce}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

/**
 * Verify a Calendly webhook signature.
 * Calendly sends a `Calendly-Webhook-Signature` header as a JWT signed
 * with the per-subscription signing key using HS256.
 * Returns true if valid, false if not — soft-fail so a bad header never
 * crashes the endpoint, but logs the rejection so it's visible.
 */
export function verifyWebhookSignature(signingKey, headerValue, logger) {
  if (!signingKey || !headerValue) return false;
  try {
    // JWT structure: header.payload.signature — verify with HMAC-SHA256
    const parts = String(headerValue).split(".");
    if (parts.length !== 3) return false;
    const data = `${parts[0]}.${parts[1]}`;
    const sigBuf = Buffer.from(parts[2], "base64url");
    const expected = crypto
      .createHmac("sha256", Buffer.from(signingKey, "utf8"))
      .update(data)
      .digest();
    return sigBuf.length === expected.length && crypto.timingSafeEqual(sigBuf, expected);
  } catch (err) {
    logger?.warn("[calendly] webhook signature verification error", { message: err.message });
    return false;
  }
}
