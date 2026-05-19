#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 7.2 — Sentry wiring smoke.
 *
 * Part 1: static wiring (no DSN required).
 * Part 2: import app without SENTRY_DSN (no throw).
 *
 * From server/: npm run test:step-7-2-sentry
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// ---- Part 1 -----------------------------------------------------------------

{
  const sentrySrc = await fs.readFile(
    path.join(process.cwd(), "src", "config", "sentry.js"),
    "utf8",
  );
  assert.ok(sentrySrc.includes("SENTRY_DSN"), "server uses SENTRY_DSN");
  assert.ok(sentrySrc.includes("beforeSend"), "PII scrub beforeSend");
  assert.ok(sentrySrc.includes("initSentry"), "initSentry export");

  const indexSrc = await fs.readFile(
    path.join(process.cwd(), "src", "index.js"),
    "utf8",
  );
  assert.ok(indexSrc.includes("./config/sentry.js"), "index imports sentry first");

  const appSrc = await fs.readFile(
    path.join(process.cwd(), "src", "app.js"),
    "utf8",
  );
  assert.ok(
    appSrc.includes("setupExpressErrorHandler"),
    "app uses Sentry express error handler",
  );
  assert.ok(appSrc.includes("sentryEnabled"), "app gates Sentry on DSN");

  const errSrc = await fs.readFile(
    path.join(process.cwd(), "src", "middleware", "errorHandler.js"),
    "utf8",
  );
  assert.ok(
    errSrc.includes("captureSentryException"),
    "errorHandler reports 5xx to Sentry",
  );

  const clientSentrySrc = await fs.readFile(
    path.join(process.cwd(), "..", "client", "src", "config", "sentry.js"),
    "utf8",
  );
  assert.ok(
    clientSentrySrc.includes("VITE_SENTRY_DSN"),
    "client uses VITE_SENTRY_DSN",
  );

  const mainSrc = await fs.readFile(
    path.join(process.cwd(), "..", "client", "src", "main.jsx"),
    "utf8",
  );
  assert.ok(mainSrc.includes("ErrorBoundary"), "client ErrorBoundary wired");
}

console.log("Part 1: Sentry surface PASSED");

// ---- Part 2 -----------------------------------------------------------------

delete process.env.SENTRY_DSN;
const cacheBuster = `?t=${Date.now()}`;
const { sentryEnabled } = await import(
  `../src/config/sentry.js${cacheBuster}`
);
assert.equal(sentryEnabled, false, "no DSN -> sentry disabled");

const { default: app } = await import(`../src/app.js${cacheBuster}`);
assert.ok(app, "app imports without SENTRY_DSN");

console.log("Part 2: Sentry disabled import PASSED");
