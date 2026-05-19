#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 3.6 — Org permission HTTP matrix smoke.
 *
 * Part 1: static audit (delegates to step_3_6_permissions_audit_smoke.mjs logic inline).
 * Part 2: HTTP matrix (`RUN_ORG_PERMISSION_HTTP_FLOWS=1`, needs Mongo).
 *
 * Run from server/:
 *   node scripts/step_3_6_permissions_smoke.mjs
 *   RUN_ORG_PERMISSION_HTTP_FLOWS=1 node scripts/step_3_6_permissions_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";
import request from "supertest";
import { ORG_PERMISSION_MANIFEST } from "./lib/orgPermissionManifest.mjs";
import { auditManifestEntry, readRoutesFile } from "./lib/orgPermissionAuditLib.mjs";
import { ORG_PERMISSION_MATRIX } from "./lib/orgPermissionMatrix.mjs";
import {
  seedOrgCohortFixtures,
  httpRequest,
} from "./lib/orgPermissionHttpHelpers.mjs";

// ---- Part 1: static audit (same as audit script) --------------------------

{
  const fileCache = new Map();
  const failures = [];
  for (const entry of ORG_PERMISSION_MANIFEST) {
    if (!fileCache.has(entry.file)) {
      fileCache.set(entry.file, await readRoutesFile(entry.file));
    }
    const result = auditManifestEntry(entry, fileCache.get(entry.file));
    if (!result.ok) {
      failures.push(`${entry.method.toUpperCase()} ${entry.pathPattern}: ${result.message}`);
    }
  }
  if (failures.length) {
    console.error("Part 1: permissions audit FAILED");
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log(`Part 1: permissions audit PASSED (${ORG_PERMISSION_MANIFEST.length} routes)`);
}

if (process.env.RUN_ORG_PERMISSION_HTTP_FLOWS !== "1") {
  console.log(
    "Part 2: HTTP matrix SKIP (set RUN_ORG_PERMISSION_HTTP_FLOWS=1 and Mongo env to run).",
  );
  process.exit(0);
}

const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

await connectDatabase();

function statusMatches(actual, expected) {
  if (Array.isArray(expected)) return expected.includes(actual);
  return actual === expected;
}

async function runCaseForPersona(testCase, ctx, personaKey, agent) {
  const path = testCase.path(ctx);
  const expect = testCase.expect[personaKey];

  if (typeof expect === "number") {
    let res;
    if (testCase.isMultipartValid && testCase.validBody) {
      res = await agent
        .post(path)
        .attach("file", Buffer.from("perm-test"), "note.txt");
    } else {
      res = await httpRequest(agent, {
        method: testCase.method,
        path,
        body: testCase.validBody ? testCase.validBody(ctx) : undefined,
      });
    }
    assert.ok(
      statusMatches(res.status, expect),
      `${testCase.id} [${personaKey}] expected ${expect}, got ${res.status}`,
    );
    return;
  }

  if (expect && typeof expect === "object") {
    if (expect.invalid !== undefined && testCase.invalidBody) {
      const resInvalid = await httpRequest(agent, {
        method: testCase.method,
        path,
        body: testCase.invalidBody(ctx),
      });
      assert.ok(
        statusMatches(resInvalid.status, expect.invalid),
        `${testCase.id} [${personaKey} invalid] expected ${expect.invalid}, got ${resInvalid.status}`,
      );
    }
    if (expect.valid !== undefined) {
      let resValid;
      if (testCase.isMultipartValid) {
        resValid = await agent
          .post(path)
          .attach("file", Buffer.from("perm-test"), "note.txt");
      } else {
        resValid = await httpRequest(agent, {
          method: testCase.method,
          path,
          body: testCase.validBody ? testCase.validBody(ctx) : undefined,
        });
      }
      assert.ok(
        statusMatches(resValid.status, expect.valid),
        `${testCase.id} [${personaKey} valid] expected ${expect.valid}, got ${resValid.status} body=${JSON.stringify(resValid.body)}`,
      );
    }
  }
}

const ctx = await seedOrgCohortFixtures(app);
const personas = {
  anonymous: request.agent(app),
  outsider: ctx.outsider.agent,
  cohortFounder: ctx.cohortFounder.agent,
  orgAdmin: ctx.orgAdmin.agent,
};

for (const testCase of ORG_PERMISSION_MATRIX) {
  await runCaseForPersona(testCase, ctx, "anonymous", personas.anonymous);
  await runCaseForPersona(testCase, ctx, "outsider", personas.outsider);
  await runCaseForPersona(testCase, ctx, "cohortFounder", personas.cohortFounder);
  await runCaseForPersona(testCase, ctx, "orgAdmin", personas.orgAdmin);
}

console.log(`Part 2: permission HTTP matrix PASSED (${ORG_PERMISSION_MATRIX.length} cases)`);

await mongoose.disconnect();
process.exit(0);
