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

function assertMatches(content, pattern, label, failures) {
  if (!pattern.test(content)) failures.push(`Missing ${label}: ${pattern}`);
}

function assertNotContains(content, needle, label, failures) {
  if (content.includes(needle)) failures.push(`Unexpected ${label}: ${needle}`);
}

async function main() {
  const failures = [];

  const usersController = await read("controllers/users.controller.js");
  const usersRoutes = await read("routes/users.routes.js");
  const orgRoutes = await read("routes/organizations.routes.js");
  const messagesRoutes = await read("routes/messages.routes.js");
  const deliverablesRoutes = await read("routes/deliverables.routes.js");
  const authRoutes = await read("routes/auth.routes.js");
  const foundersController = await read("controllers/founders.controller.js");
  const invitationsController = await read("controllers/invitations.controller.js");
  const notificationsRoutes = await read("routes/notifications.routes.js");
  const debugRoutes = await read("routes/debug.routes.js");
  const adminRoutes = await read("routes/admin.routes.js");

  assertContains(usersController, "sanitizeUser", "users controller sanitizes user payloads", failures);
  assertContains(orgRoutes, "requireOrgAdmin", "organizations routes use org admin guard", failures);
  assertContains(messagesRoutes, "requireOrgAdmin", "messages org-admin paths guarded", failures);
  assertContains(deliverablesRoutes, "requireOrgAdmin", "deliverables org-admin paths guarded", failures);
  assertContains(authRoutes, "requireAuth", "auth routes module present", failures);
  assertContains(foundersController, "founderGuard(req, req.params.founderId)", "founders ownership guard", failures);
  assertContains(invitationsController, "canAccessInterest", "interests authorization helper", failures);
  assertContains(invitationsController, "canAccessInvitation", "invitations authorization helper", failures);
  assertContains(notificationsRoutes, "isSelfOrAdmin", "notifications ownership guard", failures);
  assertContains(usersController, "export const clearNotifications", "users notifications clear controller", failures);
  assertContains(usersController, "Notification.deleteMany({ userId: req.params.userId })", "users notifications clear deleteMany", failures);
  assertContains(usersRoutes, "usersRouter.delete(", "users notifications clear route method", failures);
  assertContains(usersRoutes, "\"/users/:userId/notifications\"", "users notifications clear route path", failures);
  assertContains(usersRoutes, "requireSelfOrAdmin(\"userId\")", "users notifications clear route ownership guard", failures);
  assertContains(usersRoutes, "usersController.clearNotifications", "users notifications clear handler wiring", failures);
  assertNotContains(
    notificationsRoutes,
    "/users/:userId/notifications/mark-all-read",
    "duplicate notifications mark-all-read route in notifications router",
    failures,
  );
  assertMatches(
    notificationsRoutes,
    /\/notifications\/streak-at-risk[\s\S]*?const targetUserId = req\.body\?\.userId \|\| req\.user\.id;[\s\S]*?if \(!isSelfOrAdmin\(req, targetUserId\)\) \{[\s\S]*?return apiError\(res, "Forbidden\.", 403\);[\s\S]*?\}[\s\S]*?userId: targetUserId,/,
    "streak-at-risk route enforces ownership and uses targetUserId",
    failures,
  );
  // Debug routes must require admin
  assertContains(debugRoutes, "requireRole(\"admin\")", "debug routes admin-only", failures);
  assertMatches(
    debugRoutes,
    /\/debug\/leave-startup\/:userId[\s\S]*?requireAuth[\s\S]*?requireRole\("admin"\)/,
    "debug leave-startup admin-guarded",
    failures,
  );
  // Admin destructive endpoints must require admin
  assertMatches(
    adminRoutes,
    /\/admin\/clear-all-data[\s\S]*?requireRole\("admin"\)/,
    "admin clear-all-data admin-guarded",
    failures,
  );

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
