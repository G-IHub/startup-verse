import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const srcRoot = path.resolve(process.cwd(), "src");
const indexPath = path.join(srcRoot, "routes", "index.js");
const compatPath = path.join(srcRoot, "routes", "compatibility.routes.js");

async function main() {
  const failures = [];

  try {
    await fs.access(compatPath);
    failures.push(`compatibility.routes.js must not exist (found at ${compatPath})`);
  } catch {
    /* expected */
  }

  const index = await fs.readFile(indexPath, "utf8");
  if (index.includes("compatibility")) {
    failures.push("routes/index.js must not reference compatibility router");
  }
  if (!index.includes("./emails.routes.js") || !index.includes("./admin.routes.js") || !index.includes("./migrations.routes.js")) {
    failures.push("routes/index.js must mount emails, admin, and migrations routers");
  }

  if (failures.length) {
    console.error("Phase 5 compat-zero smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }
  console.log("Phase 5 compat-zero smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 5 compat-zero smoke crashed:", e);
  process.exit(1);
});
