#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 5.2 — Client must not call admin 501 compat routes on happy paths.
 * Google Meet routes may be called when OAuth is configured (Phase 9.1).
 *
 * From server/: npm run test:step-5-2-501-compat
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const FORBIDDEN_PATTERNS = [
  "/admin/clear-all-data",
  "/admin/nuclear-reset",
  "/admin/mega-nuclear-reset",
];

const CLIENT_SRC = path.join(process.cwd(), "..", "client", "src");
const ADMIN_ROUTES = path.join(process.cwd(), "src", "routes", "admin.routes.js");
const GOOGLE_ROUTES = path.join(process.cwd(), "src", "routes", "google.routes.js");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

{
  const adminSrc = await fs.readFile(ADMIN_ROUTES, "utf8");
  assert.ok(adminSrc.includes("notImplemented"), "admin routes use notImplemented");
  assert.ok(adminSrc.includes("admin.clear-all-data"), "clear-all-data guarded");

  const googleSrc = await fs.readFile(GOOGLE_ROUTES, "utf8");
  assert.ok(googleSrc.includes("/google/connect"), "google connect route");
  assert.ok(!googleSrc.includes("501"), "google routes implemented (no 501)");
}

const files = await walk(CLIENT_SRC);
const failures = [];

for (const file of files) {
  const text = await fs.readFile(file, "utf8");
  const rel = path.relative(path.join(process.cwd(), ".."), file).replace(/\\/g, "/");
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (text.includes(pattern)) {
      failures.push(`${rel} references forbidden path ${pattern}`);
    }
  }
}

const deletedOrphans = [
  "client/src/components/AdminNuclearReset.jsx",
  "client/src/components/AdminMegaNuclear.jsx",
  "client/src/components/AdminSuperNuclear.jsx",
  "client/src/components/OneTimeNuclearWipe.jsx",
  "client/src/utils/nuclearWipe.js",
];

for (const rel of deletedOrphans) {
  try {
    await fs.access(path.join(process.cwd(), "..", rel));
    failures.push(`orphan file should be deleted: ${rel}`);
  } catch {
    /* expected */
  }
}

if (failures.length) {
  console.error("Step 5.2 501 compat smoke FAILED");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log(
  `Step 5.2 501 compat smoke PASSED (${files.length} client files, admin patterns only)`,
);
