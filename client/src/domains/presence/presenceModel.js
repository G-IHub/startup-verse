/** Matches server PRESENCE_STALE_MS (3× 30s heartbeat) */
export const PRESENCE_STALE_MS = 90_000;

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function deriveConnection(raw, now = Date.now()) {
  if (!raw || typeof raw !== "object") {
    return { connection: "offline", isOnline: false };
  }
  // Trust server-derived connection when present (GET /presence, socket DTO).
  if (raw.connection === "online" || raw.connection === "offline") {
    return {
      connection: raw.connection,
      isOnline: raw.connection === "online",
    };
  }
  const lastSeen = toDate(raw.lastSeenAt || raw.updatedAt);
  const lastSeenMs = lastSeen ? lastSeen.getTime() : 0;
  const fresh = lastSeenMs > 0 && now - lastSeenMs < PRESENCE_STALE_MS;
  const storedOnline = Boolean(raw.isOnline);
  const isOnline = storedOnline && fresh;
  return {
    connection: isOnline ? "online" : "offline",
    isOnline,
  };
}

/**
 * Canonical presence row for stores, sockets, and roster mappers.
 */
export function normalizePresenceRow(raw, now = Date.now(), { authoritative = false } = {}) {
  if (!raw || typeof raw !== "object") return null;
  const userId = String(raw.userId || raw.id || "");
  if (!userId) return null;

  const { connection, isOnline } = deriveConnection(raw, now);
  const metadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const activity = metadata.lastFeedActivity || raw.activity || null;

  return {
    id: userId,
    userId,
    startupId: String(raw.startupId || ""),
    userName: String(raw.userName || raw.name || ""),
    name: String(raw.userName || raw.name || ""),
    role: String(raw.role || "team-member"),
    connection,
    isOnline,
    statusText: String(raw.statusText || ""),
    mood: String(raw.mood || ""),
    activity,
    cameraEnabled: Boolean(metadata.cameraEnabled ?? raw.cameraEnabled),
    lastSeenAt: toDate(raw.lastSeenAt || raw.updatedAt) || new Date(0),
    metadata,
  };
}

export function sortRosterByPresence(members) {
  const list = Array.isArray(members) ? [...members] : [];
  return list.sort((a, b) => {
    const aOnline = Boolean(a?.isOnline);
    const bOnline = Boolean(b?.isOnline);
    if (aOnline !== bOnline) return aOnline ? -1 : 1;
    const nameA = String(a?.name || a?.userName || "").toLowerCase();
    const nameB = String(b?.name || b?.userName || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export function getPresenceLabel(member) {
  if (!member) return "Offline";
  return member.isOnline || member.connection === "online" ? "Online" : "Offline";
}

export function formatLastSeen(member) {
  const at = toDate(member?.lastSeenAt);
  if (!at) return "";
  const diffMs = Date.now() - at.getTime();
  if (diffMs < 60_000) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
