import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "src");

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

function assertContains(content, needle, label, failures) {
  if (!content.includes(needle)) {
    failures.push(`Missing ${label}: ${needle}`);
  }
}

async function main() {
  const failures = [];

  const authRoutes = await read("routes/auth.routes.js");
  const founderRoutes = await read("routes/founders.routes.js");
  const orgRoutes = await read("routes/organizations.routes.js");
  const invitationRoutes = await read("routes/invitations.routes.js");
  const responseUtils = await read("utils/apiResponse.js");
  const requireAuth = await read("middleware/requireAuth.js");
  const requireOrgAdmin = await read("middleware/requireOrgAdmin.js");

  // Canonical route smoke checks
  assertContains(authRoutes, '"/auth/account/:userId"', "auth account route", failures);
  assertContains(authRoutes, "authRouter.delete(", "auth account delete method", failures);
  assertContains(founderRoutes, '"/founders/:founderId/tasks/:taskId/status"', "founder task status route", failures);
  assertContains(founderRoutes, "foundersRouter.patch(", "founder PATCH compatibility", failures);
  assertContains(orgRoutes, '"/organizations/:orgId/admins"', "org admins canonical route", failures);
  assertContains(invitationRoutes, '"/invitations/:invitationId/respond"', "invitation respond route", failures);

  // Envelope smoke checks
  assertContains(responseUtils, "success: true", "success envelope", failures);
  assertContains(responseUtils, "data,", "success data key", failures);
  assertContains(responseUtils, "success: false", "error envelope", failures);
  assertContains(responseUtils, "message,", "error message key", failures);

  // Negative path smoke checks
  assertContains(requireAuth, "401", "requireAuth unauthorized status", failures);
  assertContains(requireOrgAdmin, "403", "org-admin forbidden status", failures);
  assertContains(requireOrgAdmin, "400", "org-admin bad request status", failures);

  if (failures.length > 0) {
    console.error("Phase 1 contract smoke FAILED");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("Phase 1 contract smoke PASSED");
}

main().catch((error) => {
  console.error("Phase 1 contract smoke crashed:", error);
  process.exit(1);
});
