import crypto from "crypto";

function encryptionKey() {
  const raw = String(process.env.GITHUB_TOKEN_ENCRYPTION_KEY || "").trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "utf8");
  if (buf.length === 32) return buf;
  return crypto.createHash("sha256").update(raw).digest();
}

export function githubOAuthConfigured() {
  return Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_CALLBACK_URL &&
      encryptionKey(),
  );
}

export function encryptGithubToken(plain) {
  const key = encryptionKey();
  if (!key) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is not set.");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptGithubToken(stored) {
  const key = encryptionKey();
  if (!key) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is not set.");
  }
  const [ivHex, tagHex, dataHex] = String(stored || "").split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex"),
  );
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

export function stripIssueBody(body) {
  const text = String(body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 5000);
}

export function issueIdentity(owner, repo, number) {
  return `${owner}/${repo}#${number}`;
}
