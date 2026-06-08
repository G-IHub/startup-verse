import { useEffect, useMemo } from "react";
import * as presenceApi from "../../utils/presenceApi";
import { getStartupId } from "../../utils/startupId";
import { acquirePresenceFeed } from "./presenceSync";
import { isRealtimeConnected } from "../../utils/socketIoRealtime";

function shouldPublishPresence(user) {
  if (!user) return false;
  const role = String(user.role || "");
  if (role === "founder" || role === "team-member" || role === "team") {
    return true;
  }
  if (role === "talent" && (user.startupId || user.founderId)) {
    return true;
  }
  return false;
}

/**
 * App-wide presence: heartbeat publishes to server; presenceSync keeps store
 * aligned with GET /presence/:startupId (single source of truth for UI).
 */
export function usePresenceSession(user) {
  const startupId = useMemo(() => getStartupId(user || {}), [user]);
  const userId = String(user?._id ?? user?.id ?? "");
  const enabled = shouldPublishPresence(user) && Boolean(startupId && userId);

  useEffect(() => {
    if (!enabled) return undefined;

    const getStatus = () => ({
      userName: user?.name || "Team member",
      role: user?.role || "team-member",
      isOnline: true,
    });

    // Register online before first paint-critical fetch (reduces offline flash on refresh).
    void presenceApi.updatePresence({
      userId,
      startupId,
      ...getStatus(),
      isOnline: true,
    });

    const stopHeartbeat = presenceApi.startPresenceHeartbeat(
      userId,
      startupId,
      getStatus,
    );

    const releaseFeed = acquirePresenceFeed(startupId, userId);

    return () => {
      stopHeartbeat?.();
      releaseFeed();
    };
  }, [enabled, userId, startupId, user?.name, user?.role]);

  return {
    startupId: enabled ? startupId : "",
    userId: enabled ? userId : "",
    realtimeConnected: isRealtimeConnected(),
  };
}
