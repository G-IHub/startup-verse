/**
 * Build a JSON-serializable catalog of likely API calls from client/src (heuristic).
 */
import { scanClientApiPaths, normalizeRouteShape } from "./scanClientApiPaths.mjs";

/**
 * @param {string} clientSrcRoot
 * @returns {Promise<Array<{ path: string, method: string, files: string[] }>>}
 */
export async function buildClientApiCatalog(clientSrcRoot) {
  const byRoute = await scanClientApiPaths(clientSrcRoot);
  const filesByRoute = new Map();
  for (const [route, files] of byRoute) {
    filesByRoute.set(normalizeRouteShape(route), files);
  }

  const catalog = [];
  for (const [shape, fileSet] of filesByRoute) {
    catalog.push({
      path: shape,
      method: "GET",
      files: [...fileSet].sort(),
    });
  }

  catalog.sort((a, b) => a.path.localeCompare(b.path));
  return catalog;
}
