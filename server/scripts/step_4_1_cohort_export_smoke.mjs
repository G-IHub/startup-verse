#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 4.1 — Cohort export smoke.
 *
 * Part 1: export helpers (no DB).
 * Part 2: HTTP (`RUN_COHORT_EXPORT_HTTP=1`, needs Mongo).
 *
 * From server/:
 *   npm run test:step-4-1-cohort-export
 *   RUN_COHORT_EXPORT_HTTP=1 npm run test:step-4-1-cohort-export
 */
import assert from "node:assert/strict";
import process from "node:process";

// ---- Part 1 -----------------------------------------------------------------

{
  const {
    escapeCsvField,
    mapMemberToExportRow,
    buildCohortExportDocument,
    exportRowsToCsv,
    sanitizeExportFilename,
  } = await import("../src/utils/cohortExport.js");

  assert.equal(escapeCsvField('say "hello"'), '"say ""hello"""');
  assert.equal(escapeCsvField("a,b"), '"a,b"');

  const row = mapMemberToExportRow({
    startupName: "Acme, Inc",
    founderName: "Jane Doe",
    currentStage: "mvp",
    progress: {
      teamSize: 3,
      activityStatus: "active",
      lastActive: "2026-01-15T12:00:00.000Z",
      weeklyOutcomeStreak: 2,
    },
  });
  assert.equal(row.name, "Acme, Inc");
  assert.equal(row.weeklyStreak, 2);

  const doc = buildCohortExportDocument({
    cohort: { name: "Spring 2026", startDate: null, endDate: null },
    organizationName: "Test Org",
    members: [
      {
        startupName: "Acme, Inc",
        founderName: "Jane",
        currentStage: "mvp",
        progress: { teamSize: 1, activityStatus: "active", weeklyOutcomeStreak: 0 },
      },
    ],
  });
  assert.equal(doc.cohort.name, "Spring 2026");
  assert.equal(doc.startups.length, 1);

  const csv = exportRowsToCsv(doc.startups);
  assert.ok(csv.includes("Startup Name,Founder,Stage"), "csv header");
  assert.ok(csv.includes("Acme, Inc"), "csv row content");

  assert.equal(sanitizeExportFilename("My Cohort!"), "My_Cohort");

  const agg = await import("../src/utils/cohortMemberAggregation.js");
  assert.equal(typeof agg.loadCohortMembersForExport, "function");
  assert.equal(agg.EXPORT_MAX_MEMBERS, 500);

  const ctrl = await import("../src/controllers/cohortWorkspace.controller.js");
  assert.equal(typeof ctrl.getCohortExport, "function", "getCohortExport exported");
}

console.log("Part 1: cohort export surface PASSED");

if (process.env.RUN_COHORT_EXPORT_HTTP !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_COHORT_EXPORT_HTTP=1 and Mongo env to run).",
  );
  process.exit(0);
}

const request = (await import("supertest")).default;
const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { signAuthToken } = await import("../src/config/jwt.js");
const { default: app } = await import("../src/app.js");
const Organization = (await import("../src/models/Organization.js")).default;
const OrganizationAdmin = (await import("../src/models/OrganizationAdmin.js"))
  .default;
const Cohort = (await import("../src/models/Cohort.js")).default;
const CohortMembership = (await import("../src/models/CohortMembership.js"))
  .default;
const Startup = (await import("../src/models/Startup.js")).default;

await connectDatabase();

async function signup(role) {
  const email = `export41_${role}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}@example.com`;
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `Export ${role}`,
    email,
    password: "ExportPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role}`);
  const user = res.body?.data?.user;
  const userId = String(user?._id ?? user?.id);
  const token = signAuthToken({
    userId,
    role: user?.role || role,
    isAdmin: user?.isAdmin === true,
  });
  return { token, userId, email };
}

const admin = await signup("organization-admin");
const org = await Organization.create({
  name: `Export Org ${Date.now()}`,
  createdBy: admin.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: admin.userId,
});
admin.token = signAuthToken({
  userId: admin.userId,
  role: "organization-admin",
  isAdmin: false,
});

const cohort = await Cohort.create({
  name: `Export Cohort ${Date.now()}`,
  organizationId: org._id,
  createdBy: admin.userId,
});
const cohortId = String(cohort._id);

const founder = await signup("founder");
const startup = await Startup.create({
  name: "Export Smoke Startup",
  founderId: founder.userId,
  stage: "seed",
});
await CohortMembership.create({
  cohortId: cohort._id,
  founderId: founder.userId,
  startupId: startup._id,
  status: "active",
});

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/export?format=csv`)
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(res.status, 200, "admin csv export -> 200");
  assert.match(
    String(res.headers["content-type"] || ""),
    /text\/csv/i,
    "content-type csv",
  );
  assert.ok(
    String(res.headers["content-disposition"] || "").includes("attachment"),
    "content-disposition attachment",
  );
  assert.ok(res.text.includes("Export Smoke Startup"), "csv contains startup name");
  assert.ok(res.text.includes("Startup Name,Founder"), "csv header");
}

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/export?format=json`)
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(res.status, 200, "admin json export -> 200");
  assert.equal(res.body?.success, true);
  assert.ok(Array.isArray(res.body?.data?.startups));
  assert.ok(
    res.body.data.startups.some((s) => s.name === "Export Smoke Startup"),
    "json contains startup",
  );
}

{
  const res = await request(app).get(`/api/v1/cohorts/${cohortId}/export`);
  assert.equal(res.status, 401, "unauthenticated -> 401");
}

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/export`)
    .set("Authorization", `Bearer ${founder.token}`);
  assert.equal(res.status, 403, "founder -> 403");
}

{
  const res = await request(app)
    .get(`/api/v1/cohorts/${cohortId}/export?format=xml`)
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(res.status, 400, "invalid format -> 400");
}

await mongoose.disconnect();
console.log("Part 2: cohort export HTTP smoke PASSED");
