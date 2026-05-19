#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 5.1 — Legacy email routes cleanup smoke (no DB).
 *
 * From server/: npm run test:step-5-1-emails
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const routesPath = path.join(
  process.cwd(),
  "src",
  "routes",
  "emails.routes.js",
);

const source = await fs.readFile(routesPath, "utf8");

for (const banned of [
  "send-invitation",
  "send-notification",
  "send-welcome",
  "crypto.randomUUID",
]) {
  assert.ok(
    !source.includes(banned),
    `emails.routes.js must not contain ${banned}`,
  );
}

assert.ok(source.includes("/emails/test"), "POST /emails/test must remain");
assert.ok(
  source.includes("isEmailDeliveryEnabled"),
  "test route must report delivery status",
);

console.log("Step 5.1 emails routes smoke PASSED");
