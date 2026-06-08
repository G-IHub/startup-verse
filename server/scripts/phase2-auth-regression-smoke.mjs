import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "src");

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

function assertContains(content, needle, label, failures) {
  if (!content.includes(needle)) failures.push(`Missing ${label}: ${needle}`);
}

async function main() {
  const failures = [];

  const authController = await read("controllers/auth.controller.js");
  const usersRoutes = await read("routes/users.routes.js");
  const teamRoutes = await read("routes/teamMembers.routes.js");
  const talentRoutes = await read("routes/talent.routes.js");
  const orgRoutes = await read("routes/organizations.routes.js");
  const cronRoutes = await read("routes/cron.routes.js");
  const adminRoutes = await read("routes/admin.routes.js");
  const invitationRoutes = await read("routes/invitations.routes.js");

  assertContains(authController, "isAdmin: false", "signup admin hardening", failures);
  assertContains(authController, "allowedSignupRoles", "signup role whitelist", failures);
  assertContains(authController, '"organization-admin"', "org-admin signup role support", failures);
  assertContains(authController, "googleAuth", "Google auth controller", failures);
  assertContains(authController, "email_verified !== true", "Google verified email enforcement", failures);

  assertContains(usersRoutes, 'requireSelfOrAdmin("userId")', "users self-or-admin checks", failures);
  assertContains(teamRoutes, 'requireSelfOrAdmin("teamMemberId")', "team-member self-or-admin checks", failures);
  assertContains(talentRoutes, 'requireSelfOrAdmin("talentId")', "talent self-or-admin checks", failures);
  assertContains(orgRoutes, 'requireSelfOrAdmin("userId")', "org user scoping checks", failures);
  assertContains(orgRoutes, "/cohorts/:cohortId/program-milestones", "cohort program milestones route", failures);
  assertContains(orgRoutes, '"/organizations/:orgId/mentors"', "org mentors invite route", failures);

  assertContains(cronRoutes, 'requireRole("admin")', "cron admin guard", failures);
  assertContains(adminRoutes, 'requireRole("admin")', "admin routes admin guard", failures);
  assertContains(
    invitationRoutes,
    '"/invitations/token/:token/accept"',
    "public invitation accept route",
    failures,
  );

  if (failures.length) {
    console.error("Phase 2 auth regression smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("Phase 2 auth regression smoke PASSED");
}

main().catch((error) => {
  console.error("Phase 2 auth regression smoke crashed:", error);
  process.exit(1);
});
