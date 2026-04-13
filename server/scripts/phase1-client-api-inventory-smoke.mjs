/**
 * Phase 1.1 — fail if client API path scan regresses (broken scanner or massive client deletion).
 */
import path from "node:path";
import process from "node:process";
import { scanClientApiPaths } from "./lib/scanClientApiPaths.mjs";

const MIN_UNIQUE_ROUTES = 75;

async function main() {
  const serverRoot = process.cwd();
  const clientSrc = path.join(serverRoot, "..", "client", "src");
  const byRoute = await scanClientApiPaths(clientSrc);
  const n = byRoute.size;

  const needles = ["/auth", "/founders", "/messages", "/organizations", "/users"];
  const missing = needles.filter((prefix) => ![...byRoute.keys()].some((k) => k.startsWith(prefix)));

  const failures = [];
  if (n < MIN_UNIQUE_ROUTES) {
    failures.push(`Too few unique route shapes (${n} < ${MIN_UNIQUE_ROUTES}) — check scanner or client tree`);
  }
  if (missing.length) {
    failures.push(`Missing expected prefixes: ${missing.join(", ")}`);
  }

  if (failures.length) {
    console.error("Phase 1 client API inventory smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log(`Phase 1 client API inventory smoke PASSED (${n} unique shapes)`);
}

main().catch((e) => {
  console.error("Phase 1 client API inventory smoke crashed:", e);
  process.exit(1);
});
