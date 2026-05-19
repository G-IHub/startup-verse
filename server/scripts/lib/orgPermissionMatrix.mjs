import { API } from "./orgPermissionHttpHelpers.mjs";

/**
 * Permission matrix cases for org-integration routes.
 * `expect` keys: anonymous | outsider | cohortFounder | orgAdmin
 * orgAdmin may be a number or { invalid, valid }.
 */
export const ORG_PERMISSION_MATRIX = [
  {
    id: "getCohortMembers",
    method: "get",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/members`,
    expect: { anonymous: 401, outsider: 403, cohortFounder: 200, orgAdmin: 200 },
  },
  {
    id: "getCohortEvents",
    method: "get",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/events`,
    expect: { anonymous: 401, outsider: 403, cohortFounder: 200, orgAdmin: 200 },
  },
  {
    id: "getAnalyticsOverview",
    method: "get",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/analytics/overview`,
    expect: { anonymous: 401, outsider: 403, cohortFounder: 200, orgAdmin: 200 },
  },
  {
    id: "getPortfolioHealth",
    method: "get",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/portfolio-health`,
    expect: { anonymous: 401, outsider: 403, cohortFounder: 200, orgAdmin: 200 },
  },
  {
    id: "createCohortEvent",
    method: "post",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/events`,
    invalidBody: () => ({}),
    validBody: (ctx) => ({
      title: "Matrix Standup",
      startsAt: ctx.futureDate,
      eventType: "standup",
    }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: 201,
    },
  },
  {
    id: "createCohortAnnouncement",
    method: "post",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/announcements`,
    validBody: () => ({
      title: "Matrix Announcement",
      body: "Announcement body",
    }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: 201,
    },
  },
  {
    id: "postBulkSend",
    method: "post",
    path: () => `${API}/messages/bulk-send`,
    invalidBody: (ctx) => ({
      organizationId: ctx.orgId,
      cohortId: ctx.cohortId,
      recipientIds: [ctx.cohortFounder.userId],
    }),
    validBody: (ctx) => ({
      organizationId: ctx.orgId,
      cohortId: ctx.cohortId,
      recipientIds: [ctx.cohortFounder.userId],
      subject: "Hello",
      message: "Bulk message body",
    }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: { invalid: 400, valid: 200 },
    },
  },
  {
    id: "createInvitation",
    method: "post",
    path: () => `${API}/invitations/create`,
    invalidBody: () => ({}),
    validBody: (ctx) => ({
      cohortId: ctx.cohortId,
      founderEmail: `invite_${Date.now()}@example.com`,
    }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: { invalid: 400, valid: 201 },
    },
  },
  {
    id: "listCohortInvitations",
    method: "get",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/invitations`,
    expect: { anonymous: 401, outsider: 403, cohortFounder: 403, orgAdmin: 200 },
  },
  {
    id: "listOrgMessages",
    method: "get",
    path: (ctx) => `${API}/messages/organization/${ctx.orgId}`,
    expect: { anonymous: 401, outsider: 403, cohortFounder: 200, orgAdmin: 200 },
  },
  {
    id: "createCohortDeliverable",
    method: "post",
    path: (ctx) => `${API}/cohorts/${ctx.cohortId}/deliverables`,
    validBody: () => ({
      title: "Matrix Deliverable",
      description: "desc",
    }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: 201,
    },
  },
  {
    id: "submitDeliverable",
    method: "post",
    path: (ctx) => `${API}/deliverables/${ctx.deliverableId}/submit`,
    validBody: () => ({ content: "Submission content", status: "submitted" }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 201,
      orgAdmin: 403,
    },
  },
  {
    id: "reviewSubmission",
    method: "post",
    path: (ctx) => `${API}/deliverables/submissions/${ctx.submissionId}/review`,
    validBody: () => ({ status: "approved", feedback: "Looks good" }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: 200,
    },
  },
  {
    id: "founderToOrg",
    method: "post",
    path: () => `${API}/messages/founder-to-org`,
    validBody: (ctx) => ({
      organizationId: ctx.orgId,
      cohortId: ctx.cohortId,
      subject: "Question",
      body: "Hello org admins",
    }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 201,
      orgAdmin: 403,
    },
  },
  {
    id: "startupSnapshot",
    method: "get",
    path: (ctx) => `${API}/startups/${ctx.startupId}/snapshot`,
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 200,
      orgAdmin: 200,
    },
  },
  {
    id: "postUploads",
    method: "post",
    path: () => `${API}/uploads`,
    invalidBody: () => ({}),
    validBody: () => ({}),
    isMultipartValid: true,
    expect: {
      anonymous: 401,
      outsider: { invalid: 400, valid: 201 },
      cohortFounder: { invalid: 400, valid: 201 },
      orgAdmin: { invalid: 400, valid: 201 },
    },
  },
  {
    id: "markAnnouncementRead",
    method: "post",
    path: (ctx) =>
      `${API}/cohorts/${ctx.cohortId}/announcements/${ctx.announcementId}/read`,
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 200,
      orgAdmin: 200,
    },
  },
  {
    id: "postOrgAdmin",
    method: "post",
    path: (ctx) => `${API}/organizations/${ctx.orgId}/admins`,
    invalidBody: () => ({}),
    validBody: (ctx) => ({ email: ctx.outsider.email }),
    expect: {
      anonymous: 401,
      outsider: 403,
      cohortFounder: 403,
      orgAdmin: { invalid: 400, valid: [200, 201, 409] },
    },
  },
];
