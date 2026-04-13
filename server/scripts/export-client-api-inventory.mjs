/**
 * Phase 1.1 — scan client/src for API path usage and write API_CLIENT_CALL_INVENTORY.md
 * Usage (from server/): node scripts/export-client-api-inventory.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  scanClientApiPaths,
  classifyCompat,
} from "./lib/scanClientApiPaths.mjs";

const serverRoot = process.cwd();
const repoRoot = path.resolve(serverRoot, "..");
const clientSrc = path.join(repoRoot, "client", "src");
const outFile = path.join(serverRoot, "API_CLIENT_CALL_INVENTORY.md");

async function main() {
  const byRoute = await scanClientApiPaths(clientSrc);
  const routes = [...byRoute.keys()].sort((a, b) => a.localeCompare(b));
  const now = new Date().toISOString().slice(0, 10);

  const lines = [
    "# Client API call inventory (generated)",
    "",
    `Generated: ${now} — re-run \`node scripts/export-client-api-inventory.mjs\` from \`server/\` after client API changes.`,
    "",
    "This file supports **Phase 1.1** client call mapping (runtime calls → `/api/v1/*`); see `server/API_PARITY_MATRIX.md`.",
    "Paths are **normalized** (`${id}` → `:param`). Classification is heuristic; confirm against `API_PARITY_MATRIX.md`.",
    "",
    `**Unique route shapes:** ${routes.length}`,
    "",
    "| Route shape | Class (heuristic) | Referencing files (count) |",
    "|---|---|---|",
  ];

  for (const r of routes) {
    const files = byRoute.get(r);
    const cls = classifyCompat(r);
    const names = [...files].sort().join(", ");
    const short = names.length > 120 ? `${names.slice(0, 117)}…` : names;
    lines.push(`| \`${r}\` | ${cls} | ${files.size} — ${short} |`);
  }

  lines.push("", "## Regenerate", "", "```bash", "cd server", "node scripts/export-client-api-inventory.mjs", "```", "");

  await fs.writeFile(outFile, lines.join("\n"), "utf8");
  console.log(`Wrote ${routes.length} routes to ${path.relative(serverRoot, outFile)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
