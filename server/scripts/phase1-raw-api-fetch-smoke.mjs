/**
 * Phase 1.2 — guardrail: limit raw `fetch(\`${API_BASE_URL}` usage (migrate to backendClient).
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const serverRoot = process.cwd();
const clientSrc = path.join(serverRoot, "..", "client", "src");
const MAX_MATCHES = 70;
const ALLOW_FILES = new Set([
  "utils/backendClient.js",
  "utils/apiClient.js",
]);

const EXT = /\.(jsx?|tsx?)$/;

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build") continue;
      out.push(...(await walk(p)));
    } else if (EXT.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

function countMatches(text) {
  const re = /fetch\s*\(\s*`?\$\{API_BASE_URL\}/g;
  const m = text.match(re);
  return m ? m.length : 0;
}

async function main() {
  let total = 0;
  const byFile = [];
  for (const abs of await walk(clientSrc)) {
    const rel = path.relative(clientSrc, abs).split(path.sep).join("/");
    if (ALLOW_FILES.has(rel)) continue;
    const text = await fs.readFile(abs, "utf8");
    const n = countMatches(text);
    if (n) {
      total += n;
      byFile.push({ rel, n });
    }
  }

  if (total > MAX_MATCHES) {
    console.error(
      `Phase 1 raw API fetch smoke FAILED: ${total} raw fetch(API_BASE_URL) matches (max ${MAX_MATCHES}).`,
    );
    byFile
      .sort((a, b) => b.n - a.n)
      .slice(0, 15)
      .forEach((x) => console.error(`  ${x.n}  ${x.rel}`));
    process.exit(1);
  }

  console.log(`Phase 1 raw API fetch smoke PASSED (${total} matches ≤ ${MAX_MATCHES})`);
}

main().catch((e) => {
  console.error("Phase 1 raw API fetch smoke crashed:", e);
  process.exit(1);
});
