/**
 * Single entry: runs alignment contract/regression smokes in order.
 * Usage: from server/ → node scripts/alignment-gate-smoke.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const scripts = [
  "scripts/phase1-contract-smoke.mjs",
  "scripts/phase2-auth-regression-smoke.mjs",
  "scripts/phase3-1-behavior-smoke.mjs",
  "scripts/phase3-weekly-loop-smoke.mjs",
];

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
