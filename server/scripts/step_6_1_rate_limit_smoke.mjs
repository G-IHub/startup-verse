#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 6.1 — Rate limiting smoke.
 *
 * Part 1: middleware + app wiring (no DB).
 * Part 2: HTTP burst on POST /auth/signin → 429 RATE_LIMITED.
 *
 * From server/: npm run test:step-6-1-rate-limit
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// ---- Part 1 -----------------------------------------------------------------

{
  const rateLimitSrc = await fs.readFile(
    path.join(process.cwd(), "src", "middleware", "rateLimit.js"),
    "utf8",
  );
  assert.ok(rateLimitSrc.includes("RATE_LIMITED"), "429 uses RATE_LIMITED code");
  assert.ok(rateLimitSrc.includes("authBurstLimiter"), "authBurstLimiter export");
  assert.ok(rateLimitSrc.includes("shouldSkipApiDefaultLimiter"), "skip helper");

  const appSrc = await fs.readFile(
    path.join(process.cwd(), "src", "app.js"),
    "utf8",
  );
  assert.ok(appSrc.includes("authBurstLimiter"), "app mounts auth limiter");
  assert.ok(appSrc.includes("apiDefaultLimiter"), "app mounts default limiter");
}

console.log("Part 1: rate limit surface PASSED");

// ---- Part 2 -----------------------------------------------------------------

process.env.RATE_LIMIT_DISABLED = "false";
process.env.RATE_LIMIT_AUTH_MAX = "3";
process.env.RATE_LIMIT_AUTH_WINDOW_MS = "60000";

const { default: request } = await import("supertest");
const cacheBuster = `?t=${Date.now()}`;
const { default: app } = await import(`../src/app.js${cacheBuster}`);

const signinBody = {
  email: "rate-limit-smoke@example.com",
  password: "wrong-password-smoke",
};

let saw429 = false;
for (let i = 0; i < 4; i += 1) {
  const res = await request(app)
    .post("/api/v1/auth/signin")
    .send(signinBody);
  if (res.status === 429) {
    saw429 = true;
    assert.equal(res.body?.success, false, "429 success false");
    assert.equal(res.body?.code, "RATE_LIMITED", "429 code");
    assert.ok(
      typeof res.body?.message === "string" && res.body.message.length > 0,
      "429 message",
    );
    assert.equal(i, 3, "429 expected on 4th request when max=3");
  } else {
    assert.notEqual(
      res.status,
      429,
      `request ${i + 1} should not be rate limited yet`,
    );
  }
}

assert.ok(saw429, "4th signin attempt should return 429");

const health = await request(app).get("/health");
assert.equal(health.status, 200, "root /health not rate limited");

console.log("Part 2: rate limit HTTP smoke PASSED");
