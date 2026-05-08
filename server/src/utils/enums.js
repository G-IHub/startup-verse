export const USER_ROLES = [
  "founder",
  "team-member",
  "talent",
  "mentor",
  "investor",
  "freelancer",
  "organization-admin",
  "admin",
];

export const TASK_STATUSES = ["pending", "in-progress", "completed", "blocked"];
export const TASK_PRIORITIES = ["low", "medium", "high"];
export const WEEKLY_OUTCOME_STATUSES = ["active", "completed", "partial", "missed"];
export const INVITATION_STATUSES = ["pending", "accepted", "declined", "cancelled"];
export const INTEREST_STATUSES = ["pending", "accepted", "declined", "proposed-by-founder", "proposed-by-talent", "left"];

export const STARTUP_POST_STAGES = [
  "Idea Stage",
  "MVP Development",
  "Early Traction",
  "Growth",
];

export const STARTUP_POST_COMMITMENTS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Flexible",
];

export const STARTUP_POST_COMPENSATION_PHILOSOPHIES = [
  "equity-focused",
  "balanced",
  "cash-focused",
];

export const STARTUP_POST_VISIBILITIES = ["public", "team", "private"];

/** Organization-assigned cohort deliverable template kinds */
export const DELIVERABLE_TYPES = [
  "general",
  "milestone",
  "document",
  "report",
  "checkpoint",
  "other",
];

/** Startup submission lifecycle for a deliverable */
export const DELIVERABLE_SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "reviewed",
  "approved",
  "rejected",
  "revision_requested",
];