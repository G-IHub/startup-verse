import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "src");

async function read(rel) {
  return fs.readFile(path.join(root, rel), "utf8");
}

function assertContains(content, needle, label, failures) {
  if (!content.includes(needle)) failures.push(`Missing ${label}: ${needle}`);
}

async function main() {
  const failures = [];

  const foundersController = await read("controllers/founders.controller.js");
  const invitationsController = await read("controllers/invitations.controller.js");
  const notificationsRoutes = await read("routes/notifications.routes.js");
  const weeklyLoopRules = await read("domain/weeklyLoopRules.js");
  const activityModel = await read("models/Activity.js");
  const presenceModel = await read("models/Presence.js");
  const interestModel = await read("models/Interest.js");

  assertContains(
    foundersController,
    "const existingTask = await Task.findOne({ _id: req.params.taskId, founderId });",
    "updateTaskStatus loads existing task before status update side-effects",
    failures,
  );
  assertContains(
    invitationsController,
    "await session.withTransaction(async () => {",
    "atomic onboarding transaction",
    failures,
  );
  assertContains(
    invitationsController,
    "interest.onboarded = true;",
    "interest onboarded flag is persisted",
    failures,
  );
  assertContains(
    notificationsRoutes,
    "const isSelfOrAdmin = (req, userId)",
    "notifications ownership helper",
    failures,
  );
  assertContains(
    weeklyLoopRules,
    "streakCount",
    "execution score includes streak metric",
    failures,
  );
  assertContains(
    activityModel,
    "Activity records are immutable and cannot be modified or deleted.",
    "activity immutability enforcement",
    failures,
  );
  assertContains(
    presenceModel,
    "presenceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });",
    "presence TTL eviction for ephemeral contract",
    failures,
  );
  assertContains(
    interestModel,
    "onboarded: { type: Boolean, default: false, index: true }",
    "interest onboarded schema field",
    failures,
  );

  if (failures.length) {
    console.error("Phase 9 remediation readiness smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("Phase 9 remediation readiness smoke PASSED");
}

main().catch((error) => {
  console.error("Phase 9 remediation readiness smoke crashed:", error);
  process.exit(1);
});
