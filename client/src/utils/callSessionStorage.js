const ACTIVE_CALL_STORAGE_KEY = "sv_active_call";

export function readStoredActiveCall() {
  try {
    const raw = sessionStorage.getItem(ACTIVE_CALL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.roomName) return null;
    return {
      roomName: String(parsed.roomName),
      callType: parsed.callType === "voice" ? "voice" : "video",
      initiatorId: parsed.initiatorId ? String(parsed.initiatorId) : "",
      startupId: parsed.startupId ? String(parsed.startupId) : "",
    };
  } catch {
    return null;
  }
}

export function writeStoredActiveCall(call) {
  try {
    if (!call?.roomName) {
      sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(
      ACTIVE_CALL_STORAGE_KEY,
      JSON.stringify({
        roomName: String(call.roomName),
        callType: call.callType === "voice" ? "voice" : "video",
        initiatorId: call.initiatorId ? String(call.initiatorId) : "",
        startupId: call.startupId ? String(call.startupId) : "",
      }),
    );
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function clearStoredActiveCall() {
  writeStoredActiveCall(null);
}
