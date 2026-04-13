/**
 * Phase 1.1 — every client-scanned API path's first segment must appear on a mounted Express route module.
 */
import path from "node:path";
import process from "node:process";
import { scanClientApiPaths, normalizeRouteShape } from "./lib/scanClientApiPaths.mjs";
import {
  scanServerRoutePaths,
  routePrefixSegment,
} from "./lib/scanServerRoutes.mjs";

const serverRoot = process.cwd();
const clientSrc = path.join(serverRoot, "..", "client", "src");
const routesDir = path.join(serverRoot, "src", "routes");

/** Segments the scanner can emit that are not Express API prefixes (static / tooling). */
const CLIENT_SEGMENT_ALLOWLIST = new Set([
  "",
  "http:",
  "https:",
  "ws:",
  "wss:",
]);

/**
 * Client calls present in the repo that are not yet mounted as first-path segments under `server/src/routes`
 * (planned parity / compat backlog). Keep small; remove entries when Express routes land.
 */
const CLIENT_SEGMENT_ORPHAN_ALLOWLIST = new Set([
  "compensation",
  "compensation-contracts",
  "compensation-status",
  "meetings",
  "memberships",
  "onboard-team-member",
  "performance",
  "startups",
]);

async function main() {
  const clientMap = await scanClientApiPaths(clientSrc);
  const serverPaths = await scanServerRoutePaths(routesDir);

  const serverSegs = new Set();
  for (const p of serverPaths) {
    const seg = routePrefixSegment(p);
    if (seg) serverSegs.add(seg);
  }
  // Root app mounts these without routes/*.routes.js
  serverSegs.add("health");

  const failures = [];
  for (const raw of clientMap.keys()) {
    const shape = normalizeRouteShape(raw);
    const seg = routePrefixSegment(shape);
    if (!seg || CLIENT_SEGMENT_ALLOWLIST.has(seg)) continue;
    if (!serverSegs.has(seg) && !CLIENT_SEGMENT_ORPHAN_ALLOWLIST.has(seg)) {
      failures.push(`Client path segment "${seg}" (from \`${shape}\`) has no matching server route prefix`);
    }
  }

  if (failures.length) {
    console.error("Phase 1 client/server route smoke FAILED");
    failures.slice(0, 40).forEach((f) => console.error(`- ${f}`));
    if (failures.length > 40) console.error(`- ... and ${failures.length - 40} more`);
    process.exit(1);
  }

  console.log(
    `Phase 1 client/server route smoke PASSED (${clientMap.size} client shapes, ${serverSegs.size} server segments)`,
  );
}

main().catch((e) => {
  console.error("Phase 1 client/server route smoke crashed:", e);
  process.exit(1);
});
