/**
 * Extract Express route path strings from server route modules (static scan).
 */
import fs from "node:fs/promises";
import path from "node:path";

const METHODS = ["get", "post", "put", "patch", "delete", "use"];

export async function scanServerRoutePaths(routesDir) {
  /** @type {Set<string>} */
  const paths = new Set();
  let entries;
  try {
    entries = await fs.readdir(routesDir, { withFileTypes: true });
  } catch {
    return paths;
  }

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".routes.js")) continue;
    const abs = path.join(routesDir, e.name);
    const text = await fs.readFile(abs, "utf8");
    for (const method of METHODS) {
      const re = new RegExp(`\\.${method}\\(\\s*["']([^"']+)["']`, "g");
      let m;
      while ((m = re.exec(text))) {
        const p = m[1];
        if (p && p.startsWith("/")) paths.add(p);
      }
    }
  }

  return paths;
}

/** First URL segment after leading slash, lowercased */
export function routePrefixSegment(routePath) {
  const s = routePath.replace(/^\/+/, "");
  const seg = s.split("/")[0] || "";
  return seg.toLowerCase();
}
