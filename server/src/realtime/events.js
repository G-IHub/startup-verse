export const SOCKET_EVENTS = Object.freeze({
  PRESENCE_UPDATED: "presence:updated",
  PRESENCE_REMOVED: "presence:removed",
  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated",
  ANNOUNCEMENT_CREATED: "announcement:created",
  NOTIFICATION_CREATED: "notification:created",
  TASK_UPDATED: "task:updated",
  TASK_DELETED: "task:deleted",
  ACTIVITY_CREATED: "activity:created",
  WIN_CREATED: "win:created",
  POLL_CREATED: "poll:created",
  POLL_UPDATED: "poll:updated",
  // Interest/Invitation events for real-time inbox updates
  INTEREST_CREATED: "interest:created",
  INTEREST_UPDATED: "interest:updated",
  INVITATION_CREATED: "invitation:created",
  INVITATION_UPDATED: "invitation:updated",
  // Steps 2.3-2.7 CRUD broadcasts for cohort-scoped resources.
  // All payloads include `{ cohortId, organizationId, ... }` so client-side
  // listeners can filter without an extra fetch.
  COHORT_UPDATED: "cohort:updated",
  COHORT_DELETED: "cohort:deleted",
  EVENT_UPDATED: "event:updated",
  EVENT_DELETED: "event:deleted",
  EVENT_CANCELLED: "event:cancelled",
  RESOURCE_UPDATED: "resource:updated",
  RESOURCE_DELETED: "resource:deleted",
  MILESTONE_UPDATED: "milestone:updated",
  MILESTONE_DELETED: "milestone:deleted",
  DELIVERABLE_UPDATED: "deliverable:updated",
  DELIVERABLE_DELETED: "deliverable:deleted",
  DELIVERABLE_ARCHIVED: "deliverable:archived",
  ANNOUNCEMENT_UPDATED: "announcement:updated",
  ANNOUNCEMENT_DELETED: "announcement:deleted",
  ANNOUNCEMENT_READ: "announcement:read",
  // AI Staff orchestration — docs/ai-agent-roadmap.md Phase 0
  AGENT_EVENT_UPDATED: "agent-event:updated",
  // Transient, not persisted to AgentEvent — every AgentEvent today is only
  // ever written *after* a real action finishes (success or fail), so there
  // was no live "AI Developer is working right now" signal anywhere. Emitted
  // right before a real executor runs; the client clears it itself once the
  // matching AGENT_EVENT_UPDATED for the same targetId arrives, or after a
  // short timeout as a safety net if that never comes.
  AGENT_ACTION_STARTED: "agent-action:started",
});