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
  const deliverablesRoutes = await read("routes/deliverables.routes.js");
  const messagesRoutes = await read("routes/messages.routes.js");
  const responseUtils = await read("utils/apiResponse.js");
  const requireAuth = await read("middleware/requireAuth.js");
  const requireOrgAdmin = await read("middleware/requireOrgAdmin.js");

  // Canonical route smoke checks
  assertContains(authRoutes, '"/auth/account/:userId"', "auth account route", failures);
  assertContains(authRoutes, "authRouter.delete(", "auth account delete method", failures);
  assertContains(founderRoutes, '"/founders/:founderId/tasks/:taskId/status"', "founder task status route", failures);
  assertContains(founderRoutes, "foundersRouter.patch(", "founder PATCH compatibility", failures);
  assertContains(orgRoutes, '"/organizations/:orgId/admins"', "org admins canonical route", failures);
  assertContains(orgRoutes, "requireCohortReadAccess", "org cohort read guard on workspace GETs", failures);
  assertContains(orgRoutes, "/cohorts/organization/:orgId", "org cohort list route", failures);
  assertContains(orgRoutes, "requireOrganizationScope", "org cohort list scope guard", failures);
  assertContains(invitationRoutes, '"/invitations/:invitationId/respond"', "invitation respond route", failures);
  assertContains(deliverablesRoutes, "/cohorts/:cohortId/deliverables", "cohort deliverables route", failures);
  assertContains(deliverablesRoutes, "requireOrgAdmin", "deliverables org-admin guard", failures);
  assertContains(deliverablesRoutes, "requireCohortReadAccess", "deliverables cohort read guard", failures);
  assertContains(deliverablesRoutes, "requireDeliverableReviewAccess", "deliverables review authority guard", failures);
  assertContains(deliverablesRoutes, "requireDeliverableSubmitAccess", "deliverables submit participant guard", failures);
  assertContains(messagesRoutes, '"/messages/bulk-send"', "org bulk message route", failures);
  assertContains(messagesRoutes, '"/messages/send-individual"', "org individual message route", failures);
  assertContains(messagesRoutes, '"/messages/organization/:organizationId"', "org message list route", failures);

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
