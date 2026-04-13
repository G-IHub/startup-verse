/**
 * Single entry: runs alignment contract/regression smokes in order (Phase 1–3 static checks).
 * Usage: from server/ → node scripts/alignment-gate-smoke.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

let scripts = [
  "scripts/phase1-contract-smoke.mjs",
  "scripts/phase1-envelope-all-controllers-smoke.mjs",
  "scripts/phase1-client-api-inventory-smoke.mjs",
  "scripts/phase1-client-call-catalog-smoke.mjs",
  "scripts/phase1-client-server-route-smoke.mjs",
  "scripts/phase1-raw-api-fetch-smoke.mjs",
  "scripts/phase1-http-api-envelope-smoke.mjs",
  "scripts/phase2-auth-regression-smoke.mjs",
  "scripts/phase3-1-behavior-smoke.mjs",
  "scripts/phase3-weekly-loop-smoke.mjs",
  "scripts/phase4-realtime-alignment-smoke.mjs",
  "scripts/phase5-legacy-hosted-smoke.mjs",
  "scripts/phase5-compat-zero-smoke.mjs",
  "scripts/phase6-blueprint-gap-smoke.mjs",
  "scripts/phase8-security-alignment-smoke.mjs",
  "scripts/phase9-remediation-readiness-smoke.mjs",
];

if (process.env.RUN_CONTRACT_HTTP_FLOWS === "1") {
  scripts.push("scripts/phase1-http-contract-flows-smoke.mjs");
}

const root = process.cwd();

function run(script) {
  const full = path.join(root, script);
  const r = spawnSync(process.execPath, [full], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`\nalignment-gate-smoke FAILED at: ${script}`);
    process.exit(r.status ?? 1);
  }
}

console.log("alignment-gate-smoke: running", scripts.length, "scripts…\n");
for (const s of scripts) {
  console.log(`--- ${s} ---`);
  run(s);
}
console.log("\nalignment-gate-smoke PASSED");
