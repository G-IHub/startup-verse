import Presence from "../models/Presence.js";
import Activity from "../models/Activity.js";
import { emitRealtime } from "./realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";
import { mapActivityToDto } from "../utils/activityDto.js";

/** 3× default 30s client heartbeat */
export const PRESENCE_STALE_MS = 90_000;

const PRESENCE_EXPIRES_MS = 5 * 60 * 1000;

const NORMALIZED_ONLINE_STATUSES = new Set([
  "available",
  "in-meeting",
  "focus-mode",
  "on-break",
]);

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Effective connection from stored flags + lastSeenAt staleness.
 */
export function deriveConnection(presenceDoc, now = Date.now()) {
  if (!presenceDoc) {
    return { connection: "offline", isOnline: false };
  }
  const lastSeen = toDate(presenceDoc.lastSeenAt || presenceDoc.updatedAt);
  const lastSeenMs = lastSeen ? lastSeen.getTime() : 0;
  const fresh = lastSeenMs > 0 && now - lastSeenMs < PRESENCE_STALE_MS;
  const storedOnline = Boolean(presenceDoc.isOnline);
  const isOnline = storedOnline && fresh;
  return {
    connection: isOnline ? "online" : "offline",
    isOnline,
  };
}

export function normalizePresenceDto(doc, now = Date.now()) {
  if (!doc) return null;
  const { connection, isOnline } = deriveConnection(doc, now);
  return {
    id: String(doc._id),
    startupId: String(doc.startupId || ""),
    userId: String(doc.userId || ""),
    userName: String(doc.userName || ""),
    role: String(doc.role || ""),
    connection,
    isOnline,
    statusText: String(doc.statusText || ""),
    mood: String(doc.mood || ""),
    lastSeenAt: doc.lastSeenAt || doc.updatedAt || new Date(),
    metadata: doc.metadata || {},
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

export async function listStartupPresence(startupId) {
  const rows = await Presence.find({ startupId: String(startupId) }).sort({
    updatedAt: -1,
  });
  const now = Date.now();
  return rows.map((row) => normalizePresenceDto(row, now)).filter(Boolean);
}

export async function upsertPresence({
  startupId,
  userId,
  userName = "",
  role = "",
  isOnline = true,
  status = "available",
  statusText = "",
  mood = "",
  metadata = {},
  activity = null,
}) {
  const mergedMetadata =
    activity && typeof activity === "object"
      ? { ...metadata, lastFeedActivity: activity }
      : metadata;

  const normalizedOnline =
    typeof isOnline === "boolean"
      ? isOnline
      : NORMALIZED_ONLINE_STATUSES.has(String(status || "").toLowerCase());

  const presence = await Presence.findOneAndUpdate(
    { startupId: String(startupId), userId: String(userId) },
    {
      startupId: String(startupId),
      userId: String(userId),
      userName,
      role,
      isOnline: normalizedOnline,
      statusText: String(statusText || ""),
      mood: String(mood || ""),
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + PRESENCE_EXPIRES_MS),
      metadata: mergedMetadata,
    },
    { upsert: true, new: true, runValidators: true },
  );

  const dto = normalizePresenceDto(presence);
  emitRealtime(SOCKET_EVENTS.PRESENCE_UPDATED, dto, [startupRoom(startupId)]);

  if (activity && typeof activity === "object" && startupId) {
    const { lastFeedActivity: _ignored, ...activityMetadata } =
      mergedMetadata && typeof mergedMetadata === "object" ? mergedMetadata : {};
    const activityDoc = await Activity.create({
      startupId: String(startupId),
      userId: String(userId),
      type: String(activity.type || "update"),
      text: String(activity.message || ""),
      metadata: {
        ...activityMetadata,
        userName: String(activity.userName || userName || ""),
        icon: String(activity.icon || "📋"),
      },
    });
    emitRealtime(
      SOCKET_EVENTS.ACTIVITY_CREATED,
      mapActivityToDto(activityDoc),
      [startupRoom(startupId)],
    );
  }

  return dto;
}

export async function markOffline(startupId, userId, { emit = true } = {}) {
  const sid = String(startupId || "");
  const uid = String(userId || "");
  if (!sid || !uid) return null;

  const presence = await Presence.findOneAndUpdate(
    { startupId: sid, userId: uid },
    {
      isOnline: false,
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + PRESENCE_EXPIRES_MS),
    },
    { new: true },
  );

  if (!presence) {
    if (emit) {
      emitRealtime(
        SOCKET_EVENTS.PRESENCE_REMOVED,
        { startupId: sid, userId: uid },
        [startupRoom(sid)],
      );
    }
    return null;
  }

  const dto = normalizePresenceDto(presence);
  if (emit) {
    emitRealtime(SOCKET_EVENTS.PRESENCE_UPDATED, dto, [startupRoom(sid)]);
  }
  return dto;
}
