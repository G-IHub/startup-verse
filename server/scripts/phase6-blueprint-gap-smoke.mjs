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

  const googleRoutes = await read("routes/google.routes.js");
  const agendaRoutes = await read("routes/agenda.routes.js");
  const notificationsRoutes = await read("routes/notifications.routes.js");
  const userModel = await read("models/User.js");
  const reminderJobModel = await read("models/ReminderJob.js");
  const reminderQueue = await read("services/reminderDeliveryQueue.js");
  const adminRoutes = await read("routes/admin.routes.js");

  assertContains(googleRoutes, "/google/connect", "google OAuth connect route", failures);
  assertContains(googleRoutes, "getConnectionStatus", "google status service", failures);
  assertContains(agendaRoutes, "/calendar/:userId", "calendar route mounted", failures);
  assertContains(agendaRoutes, "programMilestones", "calendar aggregates program milestones", failures);
  assertContains(agendaRoutes, "timeline", "calendar returns unified timeline", failures);
  assertContains(agendaRoutes, "deliverables", "calendar includes deliverables", failures);
  assertContains(notificationsRoutes, "emitRealtime", "notifications emit realtime", failures);
  assertContains(notificationsRoutes, "enqueueNotificationEmitRetry", "notifications enqueue delivery retry", failures);
  assertContains(reminderJobModel, "ReminderJob", "reminder job model", failures);
  assertContains(reminderQueue, "processReminderJobsOnce", "reminder job processor export", failures);
  assertContains(reminderQueue, "getReminderDeliveryMetrics", "reminder delivery metrics export", failures);
  assertContains(adminRoutes, "/admin/reminder-delivery-metrics", "admin reminder metrics route", failures);
  assertContains(userModel, "select: false", "user password not selected by default", failures);

  if (failures.length) {
    console.error("Phase 6 blueprint gap smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }
  console.log("Phase 6 blueprint gap smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 6 blueprint gap smoke crashed:", e);
  process.exit(1);
});
