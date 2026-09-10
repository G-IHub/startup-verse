const OFFICE_CALL_PATH = "/office/call/:roomName";
const DEFAULT_OFFICE_BASE_PATH = "/office";

/**
 * All functions here accept an optional `basePath` (default "/office", V1's
 * shell) so a second shell — e.g. V2's "/v2/office" — can reuse the same
 * CallCoordinatorProvider without its calls hijacking the URL into V1's
 * routes. Always pass the shell's own office path when instantiating a new
 * CallCoordinatorProvider outside V1's DashboardHybrid.
 */

export function buildOfficeCallPath(roomName, callType = "video", basePath = DEFAULT_OFFICE_BASE_PATH) {
  const normalizedRoom = String(roomName || "").trim();
  if (!normalizedRoom) return basePath;
  const type = callType === "voice" ? "voice" : "video";
  return `${basePath}/call/${encodeURIComponent(normalizedRoom)}?type=${type}`;
}

export function parseOfficeCallRoute(pathname, search = "", basePath = DEFAULT_OFFICE_BASE_PATH) {
  const path = String(pathname || "").replace(/\/+$/, "") || "/";
  const prefix = `${basePath}/call/`;
  if (!path.startsWith(prefix)) return null;

  const roomSegment = path.slice(prefix.length);
  if (!roomSegment || roomSegment.includes("/")) return null;

  let roomName = roomSegment;
  try {
    roomName = decodeURIComponent(roomSegment);
  } catch {
    roomName = roomSegment;
  }

  const query = new URLSearchParams(
    String(search || "").startsWith("?") ? search.slice(1) : search,
  );

  return {
    roomName,
    callType: query.get("type") === "voice" ? "voice" : "video",
  };
}

export function isOfficeCallPath(pathname, basePath = DEFAULT_OFFICE_BASE_PATH) {
  return Boolean(parseOfficeCallRoute(pathname, "", basePath));
}

export { OFFICE_CALL_PATH, DEFAULT_OFFICE_BASE_PATH };
