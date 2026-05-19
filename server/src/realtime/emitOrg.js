import { emitRealtime } from "../services/realtime.service.js";
import { organizationRoom } from "./rooms.js";

/** Broadcast to org-admin dashboards joined on `organization:<id>`. */
export function emitToOrganization(orgId, eventName, payload) {
  if (!orgId) return false;
  const organizationId = String(orgId);
  return emitRealtime(
    eventName,
    { ...payload, organizationId },
    [organizationRoom(organizationId)],
  );
}
