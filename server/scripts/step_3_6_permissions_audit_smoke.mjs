#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 3.6 — Static org route permission audit (no DB).
 *
 * Run from server/:
 *   node scripts/step_3_6_permissions_audit_smoke.mjs
 */
import process from "node:process";
import { ORG_PERMISSION_MANIFEST } from "./lib/orgPermissionManifest.mjs";
import { auditManifestEntry, readRoutesFile } from "./lib/orgPermissionAuditLib.mjs";

const fileCache = new Map();

async function getFileContent(fileName) {
  if (!fileCache.has(fileName)) {
    fileCache.set(fileName, await readRoutesFile(fileName));
  }
  return fileCache.get(fileName);
}

const failures = [];

for (const entry of ORG_PERMISSION_MANIFEST) {
  const content = await getFileContent(entry.file);
  const result = auditManifestEntry(entry, content);
  if (!result.ok) {
    failures.push(`${entry.file} ${entry.method.toUpperCase()} ${entry.pathPattern}: ${result.message}`);
  }
}

if (failures.length) {
  console.error("Step 3.6 permissions audit FAILED");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log(
  `Step 3.6 permissions audit PASSED (${ORG_PERMISSION_MANIFEST.length} routes checked)`,
);
