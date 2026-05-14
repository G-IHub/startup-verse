export const SOCKET_EVENTS = Object.freeze({
  PRESENCE_UPDATED: "presence:updated",
  PRESENCE_REMOVED: "presence:removed",
  MESSAGE_CREATED: "message:created",
  ANNOUNCEMENT_CREATED: "announcement:created",
  NOTIFICATION_CREATED: "notification:created",
  TASK_UPDATED: "task:updated",
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
});