/**
 * Expected middleware (or controller auth) for organisation-integration routes.
 * `authInController: true` — route only needs requireAuth; HTTP matrix asserts 403.
 */
export const ORG_PERMISSION_MANIFEST = [
  // --- organizations.routes.js ---
  { method: "post", pathPattern: "/organizations/create", file: "organizations.routes.js", expectMiddleware: ["requireAuth"] },
  { method: "get", pathPattern: "/organizations/:orgId", file: "organizations.routes.js", expectMiddleware: ["requireAuth"] },
  { method: "put", pathPattern: "/organizations/:orgId/update", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "put", pathPattern: "/organizations/:orgId/logo", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "get", pathPattern: "/organizations/:orgId/admins", file: "organizations.routes.js", expectMiddleware: ["requireAuth"] },
  { method: "post", pathPattern: "/organizations/:orgId/admins", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "get", pathPattern: "/organizations/:orgId/mentors", file: "organizations.routes.js", expectMiddleware: ["requireAuth"] },
  { method: "post", pathPattern: "/organizations/:orgId/mentors", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },

  { method: "post", pathPattern: "/cohorts/create", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "get", pathPattern: "/cohorts/organization/:orgId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrganizationScope"] },
  { method: "get", pathPattern: "/cohorts/:cohortId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "put", pathPattern: "/cohorts/:cohortId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "delete", pathPattern: "/cohorts/:cohortId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "get", pathPattern: "/cohorts/:cohortId/badge-counts", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "get", pathPattern: "/cohorts/:cohortId/export", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "get", pathPattern: "/cohorts/:cohortId/members", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/members", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },

  { method: "get", pathPattern: "/cohorts/:cohortId/events", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/events", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "put", pathPattern: "/cohorts/:cohortId/events/:eventId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "delete", pathPattern: "/cohorts/:cohortId/events/:eventId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },

  { method: "get", pathPattern: "/cohorts/:cohortId/announcements", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/announcements", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "put", pathPattern: "/cohorts/:cohortId/announcements/:announcementId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "delete", pathPattern: "/cohorts/:cohortId/announcements/:announcementId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/announcements/:announcementId/read", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },

  { method: "get", pathPattern: "/cohorts/:cohortId/resources", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/resources", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "put", pathPattern: "/cohorts/:cohortId/resources/:resourceId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "delete", pathPattern: "/cohorts/:cohortId/resources/:resourceId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },

  { method: "get", pathPattern: "/cohorts/:cohortId/program-milestones", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/program-milestones", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "put", pathPattern: "/cohorts/:cohortId/program-milestones/:milestoneId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "delete", pathPattern: "/cohorts/:cohortId/program-milestones/:milestoneId", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },

  { method: "get", pathPattern: "/cohorts/:cohortId/analytics/overview", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "get", pathPattern: "/cohorts/:cohortId/portfolio-health", file: "organizations.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },

  {
    method: "get",
    pathPattern: "/startups/:id/snapshot",
    file: "organizations.routes.js",
    expectMiddleware: ["requireAuth"],
    authInController: true,
  },

  // --- deliverables.routes.js ---
  { method: "get", pathPattern: "/cohorts/:cohortId/deliverables", file: "deliverables.routes.js", expectMiddleware: ["requireAuth", "requireCohortReadAccess"] },
  { method: "post", pathPattern: "/cohorts/:cohortId/deliverables", file: "deliverables.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "put", pathPattern: "/cohorts/:cohortId/deliverables/:deliverableId", file: "deliverables.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "delete", pathPattern: "/cohorts/:cohortId/deliverables/:deliverableId", file: "deliverables.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "post", pathPattern: "/deliverables/:deliverableId/submit", file: "deliverables.routes.js", expectMiddleware: ["requireAuth", "requireDeliverableSubmitAccess"] },
  { method: "post", pathPattern: "/deliverables/submissions/:submissionId/review", file: "deliverables.routes.js", expectMiddleware: ["requireAuth", "requireDeliverableReviewAccess"] },

  // --- messages.routes.js ---
  { method: "post", pathPattern: "/messages/bulk-send", file: "messages.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  { method: "post", pathPattern: "/messages/send-individual", file: "messages.routes.js", expectMiddleware: ["requireAuth", "requireOrgAdmin"] },
  {
    method: "post",
    pathPattern: "/messages/founder-to-org",
    file: "messages.routes.js",
    expectMiddleware: ["requireAuth"],
    authInController: true,
  },
  {
    method: "get",
    pathPattern: "/messages/organization/:organizationId",
    file: "messages.routes.js",
    expectMiddleware: ["requireAuth"],
    authInController: true,
  },

  // --- invitations.routes.js ---
  {
    method: "post",
    pathPattern: "/invitations/create",
    file: "invitations.routes.js",
    expectMiddleware: ["requireAuth"],
    authInController: true,
  },
  {
    method: "get",
    pathPattern: "/cohorts/:cohortId/invitations",
    file: "invitations.routes.js",
    expectMiddleware: ["requireAuth", "requireOrgAdmin"],
  },
  {
    method: "post",
    pathPattern: "/invitations/:invitationId/cancel",
    file: "invitations.routes.js",
    expectMiddleware: ["requireAuth"],
    authInController: true,
  },
  {
    method: "post",
    pathPattern: "/invitations/:invitationId/resend",
    file: "invitations.routes.js",
    expectMiddleware: ["requireAuth"],
    authInController: true,
  },

  // --- mentors.routes.js (org surface) ---
  { method: "put", pathPattern: "/mentors/:mentorId", file: "mentors.routes.js", expectMiddleware: ["requireAuth", "requireMentorProfileOrgAdmin"] },
  { method: "delete", pathPattern: "/mentors/:mentorId", file: "mentors.routes.js", expectMiddleware: ["requireAuth", "requireMentorProfileOrgAdmin"] },

  // --- uploads.routes.js ---
  { method: "post", pathPattern: "/uploads", file: "uploads.routes.js", expectMiddleware: ["requireAuth"] },
];
