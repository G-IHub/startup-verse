/**
 * Phase 1.1 — list Express paths from server/src/routes for mapping docs.
 * Run from server/: node scripts/export-server-route-manifest.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { scanServerRoutePaths } from "./lib/scanServerRoutes.mjs";

const serverRoot = process.cwd();
const routesDir = path.join(serverRoot, "src", "routes");
const out = path.join(serverRoot, "API_SERVER_ROUTE_MANIFEST.generated.md");

async function main() {
  const paths = [...(await scanServerRoutePaths(routesDir))].sort();
  const lines = [
    "# Generated server route paths",
    "",
    `Count: **${paths.length}** (static scan of \`*.routes.js\`).`,
    "",
    "```",
    ...paths,
    "```",
    "",
  ];
  await fs.writeFile(out, lines.join("\n"), "utf8");
  console.log(`Wrote ${paths.length} paths to ${path.relative(serverRoot, out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
