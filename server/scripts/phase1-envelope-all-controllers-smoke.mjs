/**
 * Phase 1.2 — every `*.controller.js` must use apiResponse helpers (no raw res.json).
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "src", "controllers");

async function main() {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const failures = [];

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".controller.js")) continue;
    const p = path.join(root, e.name);
    const text = await fs.readFile(p, "utf8");

    if (!text.includes("apiResponse")) {
      failures.push(`${e.name}: missing import from apiResponse`);
    }
    const usesEnvelope =
      text.includes("apiSuccess") ||
      text.includes("apiError") ||
      text.includes("success as apiSuccess") ||
      text.includes("error as apiError");
    if (!usesEnvelope) {
      failures.push(`${e.name}: no apiSuccess/apiError usage detected`);
    }
    if (text.includes("res.json(")) {
      failures.push(`${e.name}: raw res.json( — use apiSuccess/apiError`);
    }
  }

  if (failures.length) {
    console.error("Phase 1 envelope all-controllers smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("Phase 1 envelope all-controllers smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 1 envelope all-controllers smoke crashed:", e);
  process.exit(1);
});
