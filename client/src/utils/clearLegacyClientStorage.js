import { loadAuthSession } from "../app/session";

/**
 * Removes legacy StartupVerse keys from the browser persistent KV store so persistence relies on the server.
 * Keeps session helpers consistent before iterating keys.
 */
export function wipeLegacyStartupVerseStorage() {
  if (typeof localStorage === "undefined") return;

  loadAuthSession();

  const extras = [
    "founder_journey_progress",
    "founder_profile",
    "team_needs",
    "startupverse_read_messages_timestamps",
    "outcome_stage_history",
    "last_weekly_review_reminder",
    "profileReminder_minimized",
    "profileReminder_lastShown",
  ];

  const prefixes = [
    "startupverse_",
    "sv:",
    "notifications_",
    "messages_",
    "compensation_",
    "pending_members_",
    "cohort:",
    "profileReminder",
    "tour_",
    "execution_data_",
    "sv_celebration_",
    "reminder_",
    "stage_",
  ];

  const keysToRemove = new Set(extras);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    for (const p of prefixes) {
      if (k.startsWith(p)) keysToRemove.add(k);
    }
  }

  keysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore quota / private mode */
    }
  });
}

/** Clears every key in the browser's persistent key/value store (dev-only nuclear paths). */
export function clearAllBrowserKV() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
}

/** Removes all keys except those in `keepKeys` (exact key names). */
export function removeLocalStorageKeysExcept(keepKeys = []) {
  if (typeof localStorage === "undefined") return;
  const keep = new Set(keepKeys);
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }
  keys.forEach((k) => {
    if (keep.has(k)) return;
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

export function getBrowserKVStats() {
  if (typeof localStorage === "undefined") {
    return { keyCount: 0, approxKb: "0.00" };
  }
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const v = localStorage.getItem(k) || "";
    bytes += k.length + v.length;
  }
  return {
    keyCount: localStorage.length,
    approxKb: (bytes / 1024).toFixed(2),
  };
}

/** Plain key → string snapshot for admin export / logging. */
export function snapshotBrowserKV() {
  if (typeof localStorage === "undefined") return {};
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    out[k] = localStorage.getItem(k);
  }
  return out;
}
