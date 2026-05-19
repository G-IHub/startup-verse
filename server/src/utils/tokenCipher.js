/**
 * Encrypt/decrypt OAuth tokens at rest (AES-256-GCM).
 * Key derived from JWT_SECRET or GOOGLE_OAUTH_STATE_SECRET.
 */
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest();
}

function cipherSecret() {
  return (
    process.env.GOOGLE_OAUTH_STATE_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    ""
  );
}

export function encryptToken(plaintext) {
  if (!plaintext) return "";
  const secret = cipherSecret();
  if (!secret) {
    throw new Error("JWT_SECRET (or GOOGLE_OAUTH_STATE_SECRET) required for token encryption.");
  }
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(ciphertext) {
  if (!ciphertext) return "";
  const secret = cipherSecret();
  if (!secret) {
    throw new Error("JWT_SECRET (or GOOGLE_OAUTH_STATE_SECRET) required for token decryption.");
  }
  const key = deriveKey(secret);
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
