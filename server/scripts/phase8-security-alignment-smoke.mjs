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

  const usersController = await read("controllers/users.controller.js");
  const orgRoutes = await read("routes/organizations.routes.js");
  const messagesRoutes = await read("routes/messages.routes.js");
  const deliverablesRoutes = await read("routes/deliverables.routes.js");
  const authRoutes = await read("routes/auth.routes.js");
  const foundersController = await read("controllers/founders.controller.js");
  const invitationsController = await read("controllers/invitations.controller.js");
  const notificationsRoutes = await read("routes/notifications.routes.js");

  assertContains(usersController, "sanitizeUser", "users controller sanitizes user payloads", failures);
  assertContains(orgRoutes, "requireOrgAdmin", "organizations routes use org admin guard", failures);
  assertContains(messagesRoutes, "requireOrgAdmin", "messages org-admin paths guarded", failures);
  assertContains(deliverablesRoutes, "requireOrgAdmin", "deliverables org-admin paths guarded", failures);
  assertContains(authRoutes, "requireAuth", "auth routes module present", failures);
  assertContains(foundersController, "founderGuard(req, req.params.founderId)", "founders ownership guard", failures);
  assertContains(invitationsController, "canAccessInterest", "interests authorization helper", failures);
  assertContains(invitationsController, "canAccessInvitation", "invitations authorization helper", failures);
  assertContains(notificationsRoutes, "isSelfOrAdmin", "notifications ownership guard", failures);

  if (failures.length) {
    console.error("Phase 8 security alignment smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }
  console.log("Phase 8 security alignment smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 8 security alignment smoke crashed:", e);
  process.exit(1);
});
