import { useEffect, useRef } from "react";
import {
  subscribeToOrganizationEvents,
  isRealtimeConnected,
} from "../utils/socketIoRealtime.js";

/**
 * Org-admin dashboard realtime (Phase 3).
 * Joins `organization:<organizationId>` and filters by cohortId when set.
 */
export function useOrgRealtime(organizationId, cohortId, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!organizationId) return undefined;

    const socket = subscribeToOrganizationEvents(
      organizationId,
      {
        onMessage: (p) => handlersRef.current.onMessage?.(p),
        onDeliverable: (p) => handlersRef.current.onDeliverable?.(p),
        onAnnouncement: (p) => handlersRef.current.onAnnouncement?.(p),
        onEvent: (p) => handlersRef.current.onEvent?.(p),
        onInvitation: (p) => handlersRef.current.onInvitation?.(p),
        onCohort: (p) => handlersRef.current.onCohort?.(p),
        onResource: (p) => handlersRef.current.onResource?.(p),
        onMilestone: (p) => handlersRef.current.onMilestone?.(p),
      },
      { cohortId },
    );

    return socket;
  }, [organizationId, cohortId]);

  useEffect(() => {
    if (!organizationId || !handlersRef.current.onReconnect) return undefined;

    let wasConnected = isRealtimeConnected();
    const intervalId = setInterval(() => {
      const connected = isRealtimeConnected();
      if (connected && !wasConnected) {
        handlersRef.current.onReconnect?.();
      }
      wasConnected = connected;
    }, 2000);

    return () => clearInterval(intervalId);
  }, [organizationId]);
}
