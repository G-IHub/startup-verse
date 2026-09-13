/**
 * connectGithubPat.mjs — seeds a real GitHubConnection row from a Personal
 * Access Token, for Phase 1 verification (docs/ai-agent-roadmap.md). Uses
 * the exact same GitHubConnection model + encryptGithubToken() the real
 * OAuth flow (server/src/controllers/github.controller.js) writes to, so
 * AI Developer's adapter can't tell the difference — same code path either
 * way. Validates the token against GitHub's real /user endpoint before
 * storing anything.
 *
 * Usage: FOUNDER_EMAIL=someone@example.com GITHUB_PAT=github_pat_xxx node scripts/connectGithubPat.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import GitHubConnection from "../src/models/GitHubConnection.js";
import { encryptGithubToken } from "../src/utils/githubCrypto.js";

const founderEmail = process.env.FOUNDER_EMAIL;
const pat = process.env.GITHUB_PAT;
if (!founderEmail || !pat) {
  throw new Error("Set FOUNDER_EMAIL and GITHUB_PAT.");
}
if (!process.env.GITHUB_TOKEN_ENCRYPTION_KEY) {
  throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is not set in .env.");
}

await mongoose.connect(process.env.MONGODB_CONNECTION_URI);

const founder = await User.findOne({ email: founderEmail });
if (!founder) throw new Error(`No user found for ${founderEmail}.`);

const userRes = await fetch("https://api.github.com/user", {
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${pat}`,
    "User-Agent": "StartupVerse",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});
if (!userRes.ok) {
  throw new Error(`GitHub rejected this token (${userRes.status}). Check it's valid and not expired.`);
}
const githubUser = await userRes.json();

const connection = await GitHubConnection.findOneAndUpdate(
  { userId: founder._id },
  {
    userId: founder._id,
    githubUserId: String(githubUser.id || ""),
    githubLogin: String(githubUser.login || ""),
    accessTokenEncrypted: encryptGithubToken(pat),
    scope: "fine-grained-pat",
    connectedAt: new Date(),
    revokedAt: null,
  },
  { upsert: true, new: true },
);

console.log(JSON.stringify({
  founderId: String(founder._id),
  githubLogin: connection.githubLogin,
  connectedAt: connection.connectedAt,
}, null, 2));

await mongoose.disconnect();
