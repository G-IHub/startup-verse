#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 1.5 — Ensure MongoDB text indexes for org list `?q` search.
 *
 * Idempotent: calls Model.syncIndexes() per collection in searchIndexManifest.
 * Does NOT delete documents — only adjusts indexes to match Mongoose schemas.
 *
 * Run once per environment after deploy or when text-index definitions change.
 * Do NOT invoke on every app boot (avoid index churn across instances).
 *
 * From server/:
 *   npm run db:ensure-search-indexes
 *   DRY_RUN=1 npm run db:ensure-search-indexes
 *
 * Requires MONGODB_CONNECTION_URI (loads .env.local via src/config/env.js).
 */
import process from "node:process";
import mongoose from "mongoose";
import {
  SEARCH_INDEX_MODELS,
  findTextIndexKeys,
} from "../src/db/searchIndexManifest.js";
import { connectDatabase } from "../src/config/db.js";

const dryRun = process.env.DRY_RUN === "1";

function formatIndexKeys(key) {
  if (!key || typeof key !== "object") return "{}";
  return JSON.stringify(key);
}

async function main() {
  if (dryRun) {
    console.log("DRY_RUN=1 — listing indexes only (no syncIndexes).\n");
  }

  await connectDatabase();

  for (const entry of SEARCH_INDEX_MODELS) {
    const mod = await entry.importModel();
    const Model = mod.default;
    const collectionName = Model.collection.name;

    const before = await Model.collection.indexes();

    if (dryRun) {
      const textKeys = findTextIndexKeys(before);
      console.log(
        `[${entry.name}] collection=${collectionName} textIndex=${textKeys ? textKeys.join(",") : "MISSING"} expected=${entry.expectedTextKeys.join(",")}`,
      );
      for (const idx of before) {
        console.log(`  - ${idx.name}: ${formatIndexKeys(idx.key)}`);
      }
      continue;
    }

    console.log(`[${entry.name}] syncIndexes on ${collectionName}...`);
    await Model.syncIndexes();
    const after = await Model.collection.indexes();
    const textKeys = findTextIndexKeys(after);
    const expected = [...entry.expectedTextKeys].sort().join(",");
    const actual = textKeys ? textKeys.join(",") : "";

    if (actual !== expected) {
      console.error(
        `[${entry.name}] text index mismatch: expected [${expected}], got [${actual || "none"}]`,
      );
      process.exitCode = 1;
    } else {
      console.log(`[${entry.name}] OK — text index: ${actual}`);
    }

    for (const idx of after) {
      console.log(`  - ${idx.name}: ${formatIndexKeys(idx.key)}`);
    }
  }

  await mongoose.disconnect();

  if (process.exitCode === 1) {
    console.error("\nensure-search-indexes FAILED (text index mismatch).");
    process.exit(1);
  }

  console.log(
    dryRun
      ? "\nensure-search-indexes DRY_RUN complete."
      : "\nensure-search-indexes complete.",
  );
}

main().catch((err) => {
  console.error("ensure-search-indexes error:", err?.message || err);
  process.exit(1);
});
