/**
 * Shared scanner for Phase 1.1 — extract likely `/api/v1` route tails from client source.
 */
import fs from "node:fs/promises";
import path from "node:path";

const EXT = /\.(jsx?|tsx?)$/;

export async function* walkSrc(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === "dist") continue;
      yield* walkSrc(p);
    } else if (EXT.test(e.name)) {
      yield p;
    }
  }
}

/** Collapse `/\`${...}` path params for stable grouping; strip other `${...}` (e.g. queryString). */
export function normalizeRouteShape(route) {
  let s = route.split("?")[0].split("#")[0];
  s = s.replace(/\/\$\{[^}]+\}/g, "/:param");
  s = s.replace(/\$\{[^}]+\}/g, "");
  s = s.replace(/\/+/g, "/");
  if (!s.startsWith("/")) s = `/${s}`;
  return s === "//" ? "/" : s;
}

/**
 * @param {string} clientSrcRoot absolute path to client/src
 * @returns {Map<string, Set<string>>} normalized route -> set of relative file paths
 */
export async function scanClientApiPaths(clientSrcRoot) {
  /** @type {Map<string, Set<string>>} */
  const byRoute = new Map();

  function addRoute(raw, fileRel) {
    if (!raw || raw.length < 2) return;
    const norm = normalizeRouteShape(raw);
    if (norm === "/" || norm === "/:param") return;
    if (!byRoute.has(norm)) byRoute.set(norm, new Set());
    byRoute.get(norm).add(fileRel);
  }

  for await (const abs of walkSrc(clientSrcRoot)) {
    const rel = path.relative(clientSrcRoot, abs).split(path.sep).join("/");
    let text;
    try {
      text = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }

    // `/api/v1/...` (literal or template)
    const reApiV1 = /\/api\/v1(\/(?:[a-zA-Z0-9_-]+|\/\$\{[^}]+\})+)/g;
    let m;
    while ((m = reApiV1.exec(text))) {
      addRoute(m[1], rel);
    }

    // `${API_BASE}/path` / `${API_BASE_URL}/path`
    const reBaseVar = /\$\{API_BASE(?:_URL)?\}(\/(?:[a-zA-Z0-9_-]+|\/\$\{[^}]+\})+)/g;
    while ((m = reBaseVar.exec(text))) {
      addRoute(m[1], rel);
    }

    // `${API_URL}/path` (InvitationAcceptance-style)
    const reApiUrl = /\$\{API_URL\}(\/(?:[a-zA-Z0-9_-]+|\/\$\{[^}]+\})+)/g;
    while ((m = reApiUrl.exec(text))) {
      addRoute(m[1], rel);
    }

    // `${BASE_URL}/path` (inboxApi etc.)
    const reBaseUrl = /\$\{BASE_URL\}(\/(?:[a-zA-Z0-9_-]+|\/\$\{[^}]+\})+)/g;
    while ((m = reBaseUrl.exec(text))) {
      addRoute(m[1], rel);
    }

    // request("/path", apiCall("/path", get("/path"
    const reQuoted = /\b(?:request|get|post|put|patch|del|apiRequest|apiCall)\(\s*["'](\/[^"'\n]+)["']/g;
    while ((m = reQuoted.exec(text))) {
      addRoute(m[1], rel);
    }

    // apiCall(`/path/${id}/rest`) — template first argument (backendClient / founderApi)
    const reTplArg = /\b(?:request|get|post|put|patch|apiRequest|apiCall)\(\s*`([^`]+)`\s*[,\)]/g;
    while ((m = reTplArg.exec(text))) {
      const inner = m[1].trim();
      if (inner.startsWith("/")) addRoute(inner, rel);
    }
  }

  return byRoute;
}

export function classifyCompat(shape) {
  const s = shape.toLowerCase();
  if (s.startsWith("/founder/") && !s.startsWith("/founders/")) return "compat-alias";
  if (
    s.startsWith("/cron/") ||
    s.startsWith("/kv/") ||
    s.startsWith("/debug/") ||
    s.startsWith("/admin/") ||
    s.startsWith("/migrate") ||
    s.startsWith("/migrations")
  )
    return "compat-or-admin";
  if (s.startsWith("/mentors/") || s.startsWith("/events/") || s.startsWith("/announcements/"))
    return "often-compat";
  return "canonical-or-mixed";
}
