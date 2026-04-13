/**
 * One-shot: replace duplicated VITE_API_URL fallbacks with `API_BASE_URL` from `client/src/config/apiBase.js`.
 * Run from repo root: `node server/scripts/normalize-client-api-base.mjs`
 *
 * If a file had `const API_BASE_URL = import.meta...`, this can leave a self-reference; run
 * `node server/scripts/fix-client-api-base-selfref.mjs` afterward.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const clientSrc = path.join(ROOT, "client", "src");

const LONG_PATTERNS = [
  /\$\{\s*import\.meta\.env\.VITE_API_URL\s*\|\|\s*["']http:\/\/localhost:8000\/api\/v1["']\s*\}/g,
  /\$\{\s*import\.meta\.env\.VITE_API_URL\s*\|\|\s*["']http:\/\/localhost:5000\/api\/v1["']\s*\}/g,
];
const CONST_PATTERNS = [
  /import\.meta\.env\.VITE_API_URL\s*\|\|\s*["']http:\/\/localhost:8000\/api\/v1["']/g,
  /import\.meta\.env\.VITE_API_URL\s*\|\|\s*["']http:\/\/localhost:5000\/api\/v1["']/g,
];

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === "dist") continue;
      out.push(...(await walk(p)));
    } else if (/\.(jsx?|tsx?)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

function relToApiBase(fromFile) {
  const rel = path.relative(path.dirname(fromFile), path.join(clientSrc, "config", "apiBase.js"));
  const norm = rel.split(path.sep).join("/");
  return norm.startsWith(".") ? norm : `./${norm}`;
}

function injectImport(text, fromFile) {
  const line = `import { API_BASE_URL } from "${relToApiBase(fromFile)}";\n`;
  const idx = text.indexOf("import ");
  if (idx === -1) return line + text;
  const lineEnd = text.indexOf("\n", idx);
  return text.slice(0, lineEnd + 1) + line + text.slice(lineEnd + 1);
}

/** Ensure `API_BASE_URL` is in scope: merge into existing backendClient import or add apiBase import. */
function ensureApiBaseImport(abs, text) {
  if (!/\bAPI_BASE_URL\b/.test(text)) return text;
  if (/from\s+["'][^"']*config\/apiBase\.js["']/.test(text)) return text;

  const bc = text.match(/import\s*\{([^}]+)\}\s*from\s*(["'][^"']*backendClient[^"']*["'])/);
  if (bc && !/\bAPI_BASE_URL\b/.test(bc[1])) {
    const inner = bc[1].trim().replace(/\s*,\s*$/, "");
    const merged = `${inner}, API_BASE_URL`;
    return text.replace(bc[0], `import { ${merged} } from ${bc[2]}`);
  }

  if (/from\s+["'][^"']*backendClient[^"']*["']/.test(text)) return text;

  return injectImport(text, abs);
}

async function processFile(abs) {
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  if (rel.endsWith("client/src/config/apiBase.js")) return false;

  let text = await fs.readFile(abs, "utf8");
  let next = text;
  for (const re of LONG_PATTERNS) next = next.replace(re, "${API_BASE_URL}");
  for (const re of CONST_PATTERNS) next = next.replace(re, "API_BASE_URL");

  if (next === text) return false;

  next = ensureApiBaseImport(abs, next);

  await fs.writeFile(abs, next, "utf8");
  return true;
}

async function main() {
  const files = await walk(clientSrc);
  let n = 0;
  for (const f of files) {
    if (await processFile(f)) {
      console.log(path.relative(ROOT, f));
      n += 1;
    }
  }
  console.log(`normalize-client-api-base: updated ${n} files`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
