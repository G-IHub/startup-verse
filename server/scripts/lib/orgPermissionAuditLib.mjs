import fs from "node:fs/promises";
import path from "node:path";

const GUARD_ORDER = [
  "requireAuth",
  "requireSelfOrAdmin",
  "requireOrganizationScope",
  "requireCohortReadAccess",
  "requireOrgAdmin",
  "requireDeliverableSubmitAccess",
  "requireDeliverableReviewAccess",
  "requireMentorProfileAccess",
  "requireMentorProfileOrgAdmin",
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Locate the route registration block for method + path in a routes file.
 */
export function findRouteBlock(source, method, pathPattern) {
  const re = new RegExp(
    `\\.${method}\\s*\\(\\s*["']${escapeRegex(pathPattern)}["']`,
    "i",
  );
  const idx = source.search(re);
  if (idx === -1) return null;
  const slice = source.slice(idx, idx + 1200);
  const end = slice.search(/asyncHandler\s*\(/);
  return end === -1 ? slice : slice.slice(0, end);
}

export function extractMiddlewareFromBlock(block) {
  if (!block) return [];
  const found = [];
  for (const guard of GUARD_ORDER) {
    if (block.includes(guard)) found.push(guard);
  }
  return found;
}

export async function readRoutesFile(fileName) {
  const routesDir = path.resolve(process.cwd(), "src", "routes");
  return fs.readFile(path.join(routesDir, fileName), "utf8");
}

/**
 * @param {object} entry manifest row
 * @returns {{ ok: boolean, message?: string, actual?: string[] }}
 */
export function auditManifestEntry(entry, fileContent) {
  if (entry.authInController) {
    const block = findRouteBlock(fileContent, entry.method, entry.pathPattern);
    if (!block) {
      return {
        ok: false,
        message: `route not found: ${entry.method.toUpperCase()} ${entry.pathPattern}`,
      };
    }
    if (!block.includes("requireAuth") && entry.expectMiddleware.includes("requireAuth")) {
      return { ok: false, message: "missing requireAuth at route", actual: extractMiddlewareFromBlock(block) };
    }
    return { ok: true, actual: extractMiddlewareFromBlock(block) };
  }

  const block = findRouteBlock(fileContent, entry.method, entry.pathPattern);
  if (!block) {
    return {
      ok: false,
      message: `route not found: ${entry.method.toUpperCase()} ${entry.pathPattern}`,
    };
  }
  const actual = extractMiddlewareFromBlock(block);
  const expected = entry.expectMiddleware || [];

  for (const guard of expected) {
    if (!actual.includes(guard)) {
      return {
        ok: false,
        message: `missing ${guard} on ${entry.method.toUpperCase()} ${entry.pathPattern}`,
        actual,
      };
    }
  }

  for (const guard of actual) {
    if (!expected.includes(guard)) {
      return {
        ok: false,
        message: `unexpected ${guard} on ${entry.method.toUpperCase()} ${entry.pathPattern}`,
        actual,
      };
    }
  }

  if (actual.length !== expected.length) {
    return {
      ok: false,
      message: `middleware order/count mismatch on ${entry.method.toUpperCase()} ${entry.pathPattern}`,
      actual,
    };
  }

  return { ok: true, actual };
}
