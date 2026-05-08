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
});