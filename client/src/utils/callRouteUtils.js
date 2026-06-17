const OFFICE_CALL_PATH = "/office/call/:roomName";

export function buildOfficeCallPath(roomName, callType = "video") {
  const normalizedRoom = String(roomName || "").trim();
  if (!normalizedRoom) return "/office";
  const type = callType === "voice" ? "voice" : "video";
  return `/office/call/${encodeURIComponent(normalizedRoom)}?type=${type}`;
}

export function parseOfficeCallRoute(pathname, search = "") {
  const path = String(pathname || "").replace(/\/+$/, "") || "/";
  const prefix = "/office/call/";
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

export function isOfficeCallPath(pathname) {
  return Boolean(parseOfficeCallRoute(pathname));
}

export { OFFICE_CALL_PATH };
