/**
 * Phase 1.1 — write server/API_CLIENT_CALL_CATALOG.json (path + inferred method + files).
 * Run from server/: node scripts/export-client-api-call-catalog.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { buildClientApiCatalog } from "./lib/buildClientApiCatalog.mjs";

const serverRoot = process.cwd();
const clientSrc = path.join(serverRoot, "..", "client", "src");
const outJson = path.join(serverRoot, "API_CLIENT_CALL_CATALOG.json");
const outMd = path.join(serverRoot, "API_ROUTE_MAPPING.generated.md");

async function main() {
  const catalog = await buildClientApiCatalog(clientSrc);
  await fs.writeFile(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), calls: catalog }, null, 2), "utf8");

  const lines = [
    "# Generated route mapping (client → first segment)",
    "",
    `Entries: **${catalog.length}** (from \`export-client-api-call-catalog.mjs\`).`,
    "",
    "Confirm each **first path segment** against `server/src/routes/*.routes.js` and `API_PARITY_MATRIX.md`.",
    "",
    "| Path shape | Method (guess) | Files |",
    "|---|---|---|",
  ];
  for (const row of catalog) {
    const fsList = row.files.join(", ").slice(0, 200);
    lines.push(`| \`${row.path}\` | ${row.method} | ${row.files.length}: ${fsList}${row.files.join(", ").length > 200 ? "…" : ""} |`);
  }
  await fs.writeFile(outMd, lines.join("\n"), "utf8");

  console.log(`Wrote ${catalog.length} entries to ${path.relative(serverRoot, outJson)} and ${path.relative(serverRoot, outMd)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
