#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Organization integration smoke runner (Steps 2.x + 3.x).
 *
 * Default: Part 1 only — no Mongo, no HTTP flows (safe for CI/local).
 *   npm run test:org-integration
 *
 * Opt-in HTTP matrix (requires Mongo + server/.env.local):
 *   RUN_ORG_INTEGRATION_HTTP=1 npm run test:org-integration
 *
 * Not included (need external secrets / side effects):
 *   RUN_EMAIL_LIVE, RUN_UPLOAD_LIVE
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const SCRIPTS = [
  "scripts/step_3_6_permissions_audit_smoke.mjs",
  "scripts/step_3_7_deprecated_helpers_smoke.mjs",
  "scripts/step_2_1_upload_smoke.mjs",
  "scripts/step_2_11_email_smoke.mjs",
  "scripts/step_3_1_list_query_smoke.mjs",
  "scripts/step_3_3_portfolio_health_smoke.mjs",
  "scripts/step_3_4_cohort_analytics_smoke.mjs",
  "scripts/step_2_9_snapshot_smoke.mjs",
  "scripts/step_2_10_mentor_smoke.mjs",
  "scripts/step_2_12_event_notify_smoke.mjs",
  "scripts/step_2_13_invitation_lifecycle_smoke.mjs",
  "scripts/step_2_14_founder_to_org_smoke.mjs",
  "scripts/step_3_6_permissions_smoke.mjs",
];

const HTTP_FLOW_ENV =
  process.env.RUN_ORG_INTEGRATION_HTTP === "1"
    ? {
        RUN_INVITATION_HTTP: "1",
        RUN_MENTOR_HTTP_FLOWS: "1",
        RUN_EMAIL_HTTP_FLOWS: "1",
        RUN_EVENT_NOTIFY_HTTP: "1",
        RUN_FOUNDER_TO_ORG_HTTP: "1",
        RUN_SNAPSHOT_HTTP_FLOWS: "1",
        RUN_PORTFOLIO_HEALTH_HTTP_FLOWS: "1",
        RUN_COHORT_ANALYTICS_HTTP_FLOWS: "1",
        RUN_LIST_QUERY_HTTP_FLOWS: "1",
        RUN_ORG_PERMISSION_HTTP_FLOWS: "1",
      }
    : {};

const root = process.cwd();

function run(script) {
  const full = path.join(root, script);
  const r = spawnSync(process.execPath, [full], {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, ...HTTP_FLOW_ENV },
  });
  if (r.status !== 0) {
    console.error(`\norg-integration-smoke FAILED at: ${script}`);
    process.exit(r.status ?? 1);
  }
}

const mode =
  process.env.RUN_ORG_INTEGRATION_HTTP === "1"
    ? "Part 1 + HTTP flows (Mongo required)"
    : "Part 1 only (no HTTP flags)";

console.log(`org-integration-smoke: ${mode}`);
console.log(`org-integration-smoke: running ${SCRIPTS.length} scripts…\n`);

for (const s of SCRIPTS) {
  console.log(`--- ${s} ---`);
  run(s);
}

console.log("\norg-integration-smoke PASSED");
