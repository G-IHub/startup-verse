#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 9.1 — Google OAuth / Meet smoke.
 *
 * Part 1: static wiring (no Google credentials).
 * Part 2: GET /google/status with integration disabled.
 *
 * From server/: npm run test:step-9-1-google
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// ---- Part 1 -----------------------------------------------------------------

{
  for (const rel of [
    "src/models/GoogleConnection.js",
    "src/services/googleOAuthService.js",
    "src/services/googleMeetService.js",
    "src/utils/tokenCipher.js",
    "src/utils/googleOAuthState.js",
  ]) {
    await fs.access(path.join(process.cwd(), rel));
  }

  const googleRoutes = await fs.readFile(
    path.join(process.cwd(), "src", "routes", "google.routes.js"),
    "utf8",
  );
  assert.ok(googleRoutes.includes("/google/connect"), "connect route");
  assert.ok(googleRoutes.includes("handleOAuthCallback"), "OAuth callback");
  assert.ok(googleRoutes.includes("createInstantMeet"), "instant meet");
  assert.ok(!googleRoutes.includes("501"), "no 501 stubs");

  const cfgSrc = await fs.readFile(
    path.join(process.cwd(), "src", "config", "googleIntegration.js"),
    "utf8",
  );
  assert.ok(cfgSrc.includes("GOOGLE_CLIENT_ID"), "client id env");

  const clientConnect = await fs.readFile(
    path.join(process.cwd(), "..", "client", "src", "components", "shared", "GoogleAccountConnect.jsx"),
    "utf8",
  );
  assert.ok(clientConnect.includes("/google/connect"), "client uses connect route");

  const meetSrc = await fs.readFile(
    path.join(process.cwd(), "..", "client", "src", "utils", "googleMeet.js"),
    "utf8",
  );
  assert.ok(meetSrc.includes("/google/instant-meeting/"), "client instant meet");
}

console.log("Part 1: Google OAuth surface PASSED");

// ---- Part 2 -----------------------------------------------------------------

process.env.GOOGLE_INTEGRATION_ENABLED = "false";
process.env.JWT_SECRET = process.env.JWT_SECRET || "smoke-test-jwt-secret-at-least-32-chars";
process.env.NODE_ENV = "test";
process.env.PORT = "8000";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.JWT_EXPIRES_IN = "7d";
process.env.MONGODB_CONNECTION_URI =
  process.env.MONGODB_CONNECTION_URI || "mongodb://127.0.0.1:27017";
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "startupverse_smoke";

const { default: request } = await import("supertest");
const cacheBuster = `?t=${Date.now()}`;
const { default: app } = await import(`../src/app.js${cacheBuster}`);

const statusRes = await request(app).get("/api/v1/google/status/smoke-user-id");
assert.equal(statusRes.status, 401, "status without auth is 401");

console.log("Part 2: Google disabled import PASSED");

if (process.env.RUN_GOOGLE_OAUTH_LIVE === "1") {
  console.log(
    "Part 3: RUN_GOOGLE_OAUTH_LIVE=1 — complete OAuth manually on staging (not automated).",
  );
}
