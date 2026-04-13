/**
 * Phase 1.1 — API_CLIENT_CALL_CATALOG.json must exist and stay above a minimum size.
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const serverRoot = process.cwd();
const catalogPath = path.join(serverRoot, "API_CLIENT_CALL_CATALOG.json");
const MIN_CALLS = 90;

async function main() {
  let raw;
  try {
    raw = await fs.readFile(catalogPath, "utf8");
  } catch {
    console.error("Phase 1 client call catalog smoke FAILED: missing API_CLIENT_CALL_CATALOG.json");
    console.error("Run: npm run export:client-api-call-catalog");
    process.exit(1);
  }

  const parsed = JSON.parse(raw);
  const calls = parsed.calls || [];
  if (!Array.isArray(calls) || calls.length < MIN_CALLS) {
    console.error(
      `Phase 1 client call catalog smoke FAILED: expected >= ${MIN_CALLS} calls, got ${calls.length}`,
    );
    process.exit(1);
  }

  const bad = calls.filter((c) => !c.path || !Array.isArray(c.files));
  if (bad.length) {
    console.error("Phase 1 client call catalog smoke FAILED: invalid entries", bad.length);
    process.exit(1);
  }

  console.log(`Phase 1 client call catalog smoke PASSED (${calls.length} calls)`);
}

main().catch((e) => {
  console.error("Phase 1 client call catalog smoke crashed:", e);
  process.exit(1);
});
