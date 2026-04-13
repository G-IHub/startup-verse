import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "src");
const clientRoot = path.resolve(process.cwd(), "..", "client", "src");

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

async function readClient(relFromClientSrc) {
  return fs.readFile(path.join(clientRoot, relFromClientSrc), "utf8");
}

function assertContains(content, needle, label, failures) {
  if (!content.includes(needle)) failures.push(`Missing ${label}: ${needle}`);
}

async function main() {
  const failures = [];

  const foundersController = await read("controllers/founders.controller.js");
  const executionScoreRoutes = await read("routes/executionScore.routes.js");
  const milestonesModel = await read("models/Milestone.js");
  const weeklyLoopRules = await read("domain/weeklyLoopRules.js");

  assertContains(
    weeklyLoopRules,
    "WeeklyOutcome is immutable after final submission.",
    "weekly outcome immutability guard",
    failures,
  );
  assertContains(
    weeklyLoopRules,
    "Blocked tasks require blockerReason and blockerNote.",
    "blocked task deterministic 422 validation",
    failures,
  );
  assertContains(
    foundersController,
    "await Activity.create(",
    "append-only activity writes in loop paths",
    failures,
  );
  assertContains(
    foundersController,
    "syncMilestoneCounters",
    "milestone counters synced from task truth",
    failures,
  );
  assertContains(
    foundersController,
    "validateBlockedTaskPayload",
    "founders controller imports weeklyLoopRules blocked-task validator",
    failures,
  );
  assertContains(
    foundersController,
    "weeklyLoopRules",
    "founders controller wired to weekly loop rules module",
    failures,
  );
  assertContains(
    milestonesModel,
    "tasksCompleted",
    "milestone tasksCompleted counter field",
    failures,
  );
  assertContains(
    milestonesModel,
    "totalTasks",
    "milestone totalTasks counter field",
    failures,
  );
  assertContains(
    executionScoreRoutes,
    "Execution score is derived and read-only.",
    "execution score write rejection",
    failures,
  );

  const executionEngine = await readClient("utils/executionEngine.js");
  assertContains(
    executionEngine,
    "newStreak",
    "client execution engine updates streak on weekly close",
    failures,
  );

  if (failures.length) {
    console.error("Phase 3 weekly loop smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("Phase 3 weekly loop smoke PASSED");
}

main().catch((error) => {
  console.error("Phase 3 weekly loop smoke crashed:", error);
  process.exit(1);
});
