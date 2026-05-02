/**
 * Automated pre-release verification (no DB required for default path):
 * 1. Full alignment gate (contract, envelopes, client/server routes, smokes)
 * 2. Client Vite production build
 *
 * Optional: VERIFY_HTTP_FLOWS=1 runs phase1 HTTP contract flows (needs Mongo + .env)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverRoot, "..");
const clientRoot = path.join(repoRoot, "client");

function run(label, command, args, cwd, extraEnv = {}) {
  console.log(`\nverify-release: ${label}…`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    console.error(`verify-release: FAILED at "${label}" (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}

run("alignment gate", "npm", ["run", "test:alignment-gate"], serverRoot);

if (String(process.env.VERIFY_HTTP_FLOWS || "").trim() === "1") {
  run(
    "HTTP contract flows (Mongo + .env required)",
    "npm",
    ["run", "test:phase1-http-flows"],
    serverRoot,
    { RUN_CONTRACT_HTTP_FLOWS: "1" },
  );
}

run("client production build", "npm", ["run", "build"], clientRoot);

console.log("\nverify-release: PASSED (alignment gate + client build)");
if (String(process.env.VERIFY_HTTP_FLOWS || "").trim() !== "1") {
  console.log(
    "Tip: set VERIFY_HTTP_FLOWS=1 for Mongo-backed HTTP flows (staging CI).",
  );
}
