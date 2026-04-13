/**
 * Remove accidental `const API_BASE_URL =\n  API_BASE_URL;` blocks left by normalize-client-api-base.
 * Run from repo root: `node server/scripts/fix-client-api-base-selfref.mjs`
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const clientSrc = path.join(ROOT, "client", "src");

const BAD = /\nconst API_BASE_URL\s*=\s*\n\s*API_BASE_URL;\s*/g;

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build") continue;
      out.push(...(await walk(p)));
    } else if (/\.(jsx?|tsx?)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  let n = 0;
  for (const f of await walk(clientSrc)) {
    let t = await fs.readFile(f, "utf8");
    const next = t.replace(BAD, "\n");
    if (next !== t) {
      await fs.writeFile(f, next, "utf8");
      console.log(path.relative(ROOT, f));
      n += 1;
    }
  }
  console.log(`fixed ${n} files`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
