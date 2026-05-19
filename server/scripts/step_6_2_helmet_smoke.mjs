#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 6.2 — Helmet security headers smoke.
 *
 * Part 1: middleware + app wiring (no DB).
 * Part 2: GET /health returns expected security headers.
 *
 * From server/: npm run test:step-6-2-helmet
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// ---- Part 1 -----------------------------------------------------------------

{
  const securitySrc = await fs.readFile(
    path.join(process.cwd(), "src", "middleware", "securityHeaders.js"),
    "utf8",
  );
  assert.ok(securitySrc.includes("helmet"), "securityHeaders uses helmet");
  assert.ok(
    securitySrc.includes("HELMET_DISABLED"),
    "HELMET_DISABLED escape hatch",
  );
  assert.ok(
    securitySrc.includes("cross-origin"),
    "CORP cross-origin for credentialed SPA",
  );
  assert.ok(
    securitySrc.includes("securityHeadersMiddleware"),
    "securityHeadersMiddleware export",
  );

  const appSrc = await fs.readFile(
    path.join(process.cwd(), "src", "app.js"),
    "utf8",
  );
  assert.ok(
    appSrc.includes("securityHeadersMiddleware"),
    "app mounts security headers",
  );
}

console.log("Part 1: helmet surface PASSED");

// ---- Part 2 -----------------------------------------------------------------

process.env.HELMET_DISABLED = "false";
process.env.NODE_ENV = "test";

const { default: request } = await import("supertest");
const cacheBuster = `?t=${Date.now()}`;
const { default: app } = await import(`../src/app.js${cacheBuster}`);

const res = await request(app).get("/health");
assert.equal(res.status, 200, "/health status");

const headers = res.headers;
assert.equal(
  headers["x-content-type-options"],
  "nosniff",
  "X-Content-Type-Options",
);

assert.ok(
  typeof headers["x-frame-options"] === "string" &&
    headers["x-frame-options"].length > 0,
  "X-Frame-Options present",
);

assert.ok(
  typeof headers["referrer-policy"] === "string" &&
    headers["referrer-policy"].length > 0,
  "Referrer-Policy present",
);

console.log("Part 2: helmet HTTP smoke PASSED");
