#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.1 — Upload service smoke (Cloudinary-only).
 *
 * Part 1 (always): scope normalization + buffer guard + missing-config error.
 * Part 2 (opt-in): `RUN_UPLOAD_LIVE=1` + Cloudinary env — one real upload.
 *
 * Run from server/:
 *   node scripts/step_2_1_upload_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

const cacheBuster = () => `?t=${Date.now()}_${Math.random()}`;

function clearCloudinaryEnv() {
  delete process.env.CLOUDINARY_URL;
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  delete process.env.STORAGE_DRIVER;
  delete process.env.UPLOAD_ROOT_DIR;
}

const { normalizeUploadScope, uploadBuffer } = await import(
  `../src/services/uploadService.js${cacheBuster()}`
);

assert.equal(normalizeUploadScope(""), "general", "empty scope -> general");
assert.equal(normalizeUploadScope(undefined), "general", "undefined scope -> general");
assert.equal(normalizeUploadScope("../../../etc"), "general", "traversal -> general");
assert.equal(normalizeUploadScope("foo/bar"), "general", "slash scope -> general");
assert.equal(normalizeUploadScope(".env"), "general", "dot scope -> general");
assert.equal(normalizeUploadScope("org-logo"), "org-logo", "valid scope preserved");
assert.equal(normalizeUploadScope("messages"), "messages", "messages scope preserved");

{
  let threw = false;
  try {
    await uploadBuffer({ buffer: null, scope: "smoke" });
  } catch (err) {
    threw = /buffer is required/.test(err.message);
  }
  assert.ok(threw, "missing buffer throws");
}

clearCloudinaryEnv();
{
  let threw = false;
  try {
    await uploadBuffer({
      buffer: Buffer.from("x"),
      scope: "smoke",
    });
  } catch (err) {
    threw = /Cloudinary is not configured/.test(err.message);
  }
  assert.ok(threw, "missing Cloudinary config throws");
}

console.log("Part 1: upload scope + guards PASSED");

if (process.env.RUN_UPLOAD_LIVE === "1") {
  const { isCloudinaryConfigured } = await import("../src/config/cloudinary.js");
  if (!isCloudinaryConfigured()) {
    console.error(
      "Part 2: needs CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.",
    );
    process.exit(1);
  }

  const result = await uploadBuffer({
    buffer: Buffer.from("startupverse upload smoke", "utf-8"),
    mimeType: "text/plain",
    originalName: "smoke.txt",
    scope: "smoke",
  });
  assert.ok(result.url.startsWith("https://"), "live upload returns https URL");
  assert.ok(result.key.includes("startupverse/smoke"), "public_id is folder-scoped");
  assert.equal(result.mimeType, "text/plain", "mimeType echoed");
  assert.ok(result.size > 0, "size is positive");
  console.log("Part 2: live Cloudinary upload PASSED", { url: result.url });
} else {
  console.log(
    "Part 2: live upload SKIP (set RUN_UPLOAD_LIVE=1 + Cloudinary env to run).",
  );
}

console.log("done");
