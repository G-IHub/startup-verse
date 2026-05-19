#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 1.5 — Search index manifest smoke (no Mongo required for Part 1).
 *
 * Part 1: manifest expectedTextKeys match each model's Mongoose text index.
 * Part 2: optional DB verify (`RUN_SEARCH_INDEX_DB=1`, needs Mongo + sync).
 *
 * From server/:
 *   npm run test:step-1-5-search-indexes
 *   RUN_SEARCH_INDEX_DB=1 npm run test:step-1-5-search-indexes
 */
import assert from "node:assert/strict";
import process from "node:process";
import {
  SEARCH_INDEX_MODELS,
  expectedTextKeysFromSchema,
  textKeysFromIndexName,
} from "../src/db/searchIndexManifest.js";

assert.deepEqual(textKeysFromIndexName("title_text_description_text"), [
  "description",
  "title",
]);
assert.deepEqual(textKeysFromIndexName("title_text_body_text"), ["body", "title"]);

// ---- Part 1: schema vs manifest (no DB) -----------------------------------

for (const entry of SEARCH_INDEX_MODELS) {
  const mod = await entry.importModel();
  const Model = mod.default;
  const fromSchema = expectedTextKeysFromSchema(Model.schema).join(",");
  const expected = [...entry.expectedTextKeys].sort().join(",");
  assert.equal(
    fromSchema,
    expected,
    `${entry.name}: schema text keys [${fromSchema}] !== manifest [${expected}]`,
  );
}

console.log(
  `Part 1: search index manifest smoke PASSED (${SEARCH_INDEX_MODELS.length} models).`,
);

if (process.env.RUN_SEARCH_INDEX_DB !== "1") {
  console.log(
    "Part 2: DB verify SKIP (set RUN_SEARCH_INDEX_DB=1 and Mongo env to run).",
  );
  process.exit(0);
}

const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { findTextIndexKeys } = await import("../src/db/searchIndexManifest.js");

await connectDatabase();

for (const entry of SEARCH_INDEX_MODELS) {
  const mod = await entry.importModel();
  const Model = mod.default;
  const indexes = await Model.collection.indexes();
  const foundKeys = findTextIndexKeys(indexes);
  const found = foundKeys ? foundKeys.join(",") : null;
  const expected = [...entry.expectedTextKeys].sort().join(",");
  assert.equal(
    found,
    expected,
    `${entry.name}: DB text index [${found || "none"}] !== expected [${expected}]`,
  );
}

await mongoose.disconnect();
console.log("Part 2: DB text index verify PASSED.");
