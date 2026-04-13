/**
 * Phase 5 — no active runtime references to vendor-hosted serverless URLs.
 * Scans client/src and server/src (js, jsx, mjs, ts, tsx).
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "..");
const scanRoots = [
  path.join(root, "client", "src"),
  path.join(root, "server", "src"),
];

const BANNED = [
  /supabase\.co/i,
  /supabase\.io/i,
  /cloudfunctions\.net/i,
  /firebaseio\.com/i,
  /\.netlify\.functions/i,
  /functions\.supabase/i,
];

const ALLOWLIST_SUBSTRINGS = [
  "node_modules",
  ".test.",
  ".spec.",
  "PHASE0",
  "PHASE1",
  "legacy-hosted-smoke",
];

async function* walkFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "build" || ent.name === "dist") continue;
      yield* walkFiles(full);
    } else if (/\.(js|jsx|mjs|ts|tsx)$/.test(ent.name)) {
      yield full;
    }
  }
}

async function main() {
  const hits = [];
  for (const scanRoot of scanRoots) {
    for await (const file of walkFiles(scanRoot)) {
      const rel = path.relative(root, file);
      if (ALLOWLIST_SUBSTRINGS.some((s) => rel.includes(s))) continue;
      const text = await fs.readFile(file, "utf8");
      for (const re of BANNED) {
        if (re.test(text)) {
          hits.push(`${rel} matched ${re}`);
        }
      }
    }
  }

  if (hits.length) {
    console.error("Phase 5 legacy hosted runtime smoke FAILED");
    hits.forEach((h) => console.error(`- ${h}`));
    process.exit(1);
  }
  console.log("Phase 5 legacy hosted runtime smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 5 legacy hosted runtime smoke crashed:", e);
  process.exit(1);
});
