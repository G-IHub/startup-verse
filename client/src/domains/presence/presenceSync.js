/**
 * Single presence feed per startup. Display state comes only from GET /presence/:startupId
 * (server applies staleness). Socket events debounce a re-fetch — no local merge races.
 */

import { getActiveUsers } from "../../utils/presenceApi.js";
import {
  registerPresenceSocket,
  listenForPresenceChanges,
} from "../../utils/socketIoRealtime.js";
import { useOfficeStore } from "../../state/useOfficeStore.js";

const feedsByStartup = new Map();

async function pullAuthoritativeSnapshot(startupId, trigger = "unknown") {
  const sid = String(startupId || "");
  if (!sid) return;
  const result = await getActiveUsers(sid);
  if (result?.success) {
    const rows = result.presence || [];
    // Avoid wiping store with empty snapshot while heartbeats are still registering.
    if (rows.length === 0 && trigger !== "feed-init") {
      return;
    }
    useOfficeStore.getState().setPresenceFromServer(rows);
  }
}

function createFeed(startupId, userId) {
  const sid = String(startupId);
  let refreshTimer = null;

  const scheduleRefresh = (reason = "socket") => {
    if (refreshTimer != null) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void pullAuthoritativeSnapshot(sid, reason);
    }, 400);
  };

  registerPresenceSocket(sid, userId);
  const stopListening = listenForPresenceChanges(scheduleRefresh);

  void pullAuthoritativeSnapshot(sid, "feed-init");

  const pollInterval = setInterval(() => {
    void pullAuthoritativeSnapshot(sid, "poll-30s");
  }, 30_000);

  return () => {
    if (refreshTimer != null) clearTimeout(refreshTimer);
    clearInterval(pollInterval);
    stopListening();
  };
}

/** Start the shared presence feed for a startup (ref-counted). */
export function acquirePresenceFeed(startupId, userId) {
  const sid = String(startupId || "");
  const uid = String(userId || "");
  if (!sid || !uid) return () => {};

  let entry = feedsByStartup.get(sid);
  if (!entry) {
    const cleanup = createFeed(sid, uid);
    entry = { refCount: 0, cleanup };
    feedsByStartup.set(sid, entry);
  }
  entry.refCount += 1;

  return () => {
    const current = feedsByStartup.get(sid);
    if (!current) return;
    current.refCount -= 1;
    if (current.refCount <= 0) {
      current.cleanup?.();
      feedsByStartup.delete(sid);
    }
  };
}

export function refreshPresenceSnapshot(startupId) {
  return pullAuthoritativeSnapshot(startupId);
}
