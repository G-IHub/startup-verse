/**
 * Single source of truth for org list `?q` text indexes (Step 1.5).
 * Used by ensure-search-indexes.mjs and step_1_5_search_indexes_smoke.mjs.
 */
export const SEARCH_INDEX_MODELS = [
  {
    name: "Resource",
    importModel: () => import("../models/Resource.js"),
    expectedTextKeys: ["title", "description", "tags"],
  },
  {
    name: "Deliverable",
    importModel: () => import("../models/Deliverable.js"),
    expectedTextKeys: ["title", "description"],
  },
  {
    name: "Event",
    importModel: () => import("../models/Event.js"),
    expectedTextKeys: ["title", "description"],
  },
  {
    name: "ProgramMilestone",
    importModel: () => import("../models/ProgramMilestone.js"),
    expectedTextKeys: ["title", "description"],
  },
  {
    name: "Announcement",
    importModel: () => import("../models/Announcement.js"),
    expectedTextKeys: ["title", "body"],
  },
];

/**
 * Extract searchable field names from a Mongoose schema text index spec.
 * @param {Record<string, unknown>} keySpec
 * @returns {string[]}
 */
const INTERNAL_TEXT_INDEX_KEYS = new Set(["_fts", "_ftsx"]);

export function textKeysFromIndexSpec(keySpec) {
  if (!keySpec || typeof keySpec !== "object") return [];
  return Object.entries(keySpec)
    .filter(([k, v]) => v === "text" && !INTERNAL_TEXT_INDEX_KEYS.has(k))
    .map(([k]) => k)
    .sort();
}

/**
 * Parse Mongoose default text index names (e.g. `title_text_description_text`).
 * @param {string | undefined} indexName
 * @returns {string[]}
 */
export function textKeysFromIndexName(indexName) {
  if (!indexName || typeof indexName !== "string" || !indexName.includes("_text")) {
    return [];
  }
  const stem = indexName.endsWith("_text") ? indexName.slice(0, -5) : indexName;
  return stem
    .split("_text_")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
}

/**
 * Field names from a MongoDB collection index entry (post-sync).
 * Text indexes use `_fts`/`_ftsx` in `key`; field names live in `weights` or index `name`.
 * @param {{ key?: Record<string, unknown>, weights?: Record<string, number>, name?: string } | null} indexEntry
 * @returns {string[]}
 */
export function textKeysFromCollectionIndex(indexEntry) {
  if (!indexEntry?.key || typeof indexEntry.key !== "object") return [];
  const fromKey = textKeysFromIndexSpec(indexEntry.key);
  if (fromKey.length > 0) return fromKey;
  if (indexEntry.key._fts === "text") {
    if (indexEntry.weights && typeof indexEntry.weights === "object") {
      return Object.keys(indexEntry.weights).sort();
    }
    return textKeysFromIndexName(indexEntry.name);
  }
  return [];
}

/**
 * @param {Array<{ key?: Record<string, unknown>, weights?: Record<string, number> }>} indexList
 * @returns {string[] | null}
 */
export function findTextIndexKeys(indexList) {
  for (const idx of indexList) {
    const keys = textKeysFromCollectionIndex(idx);
    if (keys.length > 0) return keys;
  }
  return null;
}

/**
 * Find the text index key spec on a Mongoose schema (at most one per collection).
 * @param {import("mongoose").Schema} schema
 * @returns {string[]}
 */
export function expectedTextKeysFromSchema(schema) {
  const indexes = schema.indexes();
  for (const [keySpec] of indexes) {
    const keys = textKeysFromIndexSpec(keySpec);
    if (keys.length > 0) return keys;
  }
  return [];
}
