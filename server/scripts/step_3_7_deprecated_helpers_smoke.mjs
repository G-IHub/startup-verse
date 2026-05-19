#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 3.7 — Fail if deprecated org helper exports reappear in client/src.
 *
 * Run from server/:
 *   npm run test:step-3-7-deprecated-helpers
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BANNED_EXPORTS = [
  "getAllOrganizations",
  "getOrganizationMembers",
  "getOrganizationMembersByOrg",
  "getAllCohorts",
  "updateCohortStats",
  "getAllCohortInvitations",
  "getCohortInvitations",
  "createCohortInvitation",
  "getAllCohortMemberships",
  "getCohortMemberships",
  "createCohortMembership",
  "calculateStartupStatus",
];

const EXPORT_PATTERN = new RegExp(
  `\\bexport\\s+(?:async\\s+)?function\\s+(${BANNED_EXPORTS.join("|")})\\b`,
  "g",
);

const CLIENT_SRC = path.join(process.cwd(), "..", "client", "src");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await walk(CLIENT_SRC);
  const failures = [];

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    EXPORT_PATTERN.lastIndex = 0;
    let match;
    while ((match = EXPORT_PATTERN.exec(text)) !== null) {
      const line = text.slice(0, match.index).split("\n").length;
      failures.push(
        `${path.relative(path.join(process.cwd(), ".."), file)}:${line} re-exports banned helper ${match[1]}`,
      );
    }
  }

  if (failures.length) {
    console.error("Step 3.7 deprecated helpers smoke FAILED");
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  console.log(
    `Step 3.7 deprecated helpers smoke PASSED (${BANNED_EXPORTS.length} symbols banned, ${files.length} files scanned)`,
  );
}

main().catch((err) => {
  console.error("Step 3.7 deprecated helpers smoke crashed:", err);
  process.exit(1);
});
