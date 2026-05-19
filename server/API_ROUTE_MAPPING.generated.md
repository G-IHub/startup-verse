# Generated route mapping (client → first segment)

Entries: **114** (from `export-client-api-call-catalog.mjs`).

Confirm each **first path segment** against `server/src/routes/*.routes.js` and `API_PARITY_MATRIX.md`.

| Path shape | Method (guess) | Files |
|---|---|---|
| `/admin` | GET | 2: components/AdminDatabaseClear.jsx, utils/adminAnalytics.js |
| `/agenda` | GET | 1: components/calendar/AgendaNotificationTrigger.jsx |
| `/agenda/:param` | GET | 1: components/calendar/AgendaNotificationTrigger.jsx |
| `/announcements/:param` | GET | 1: components/organizations/OrganizationAnnouncementsWidget.jsx |
| `/auth` | GET | 4: api/authApi.jsx, config/apiBase.js, utils/api/authApi.js, utils/backendHealthCheck.js |
| `/cohorts` | GET | 1: utils/calendarIntegration.js |
| `/cohorts/:param` | GET | 10: components/organizations/CohortAnalyticsDashboard.jsx, components/organizations/CommunicationCenter.jsx, components/organizations/DeliverablesManager.jsx, components/organizations/EventManager.jsx, co… |
| `/cohorts/:param/announcements/:param` | GET | 1: utils/api/organizationApi.js |
| `/cohorts/:param/announcements/:param/read` | GET | 1: utils/api/organizationApi.js |
| `/cohorts/:param/badge-counts` | GET | 1: utils/api/organizationApi.js |
| `/cohorts/create` | GET | 1: utils/api/organizationApi.js |
| `/cohorts/organization/:param` | GET | 1: utils/api/organizationApi.js |
| `/compensation` | GET | 1: utils/api/compensationApi.js |
| `/compensation-contracts` | GET | 1: utils/api/compensationApi.js |
| `/compensation-status/:param` | GET | 1: utils/api/compensationApi.js |
| `/deliverables` | GET | 3: components/founders/FounderDeliverablesView.jsx, components/organizations/DeliverablesManager.jsx, utils/calendarIntegration.js |
| `/deliverables/:param` | GET | 1: components/founders/FounderDeliverablesView.jsx |
| `/events/:param` | GET | 1: components/organizations/OrganizationEventsWidget.jsx |
| `/execution-score/:param` | GET | 1: components/ExecutionScore.jsx |
| `/founder/:param` | GET | 4: components/organizations/OrganizationAnnouncementsWidget.jsx, components/organizations/OrganizationEventsWidget.jsx, utils/calendarIntegration.js, utils/eventReminders.js |
| `/founders` | GET | 1: utils/api/founderApi.js |
| `/founders/:param` | GET | 3: components/analytics/AnalyticsDashboard.jsx, components/founders/FounderResourcesView.jsx, utils/calendarIntegration.js |
| `/founders/:param/execution-data` | GET | 1: utils/api/coreEngineApi.js |
| `/founders/:param/intent-parse` | GET | 1: utils/api/founderApi.js |
| `/founders/:param/invitations` | GET | 1: utils/api/founderApi.js |
| `/founders/:param/milestones` | GET | 3: utils/api/coreEngineApi.js, utils/api/founderApi.js, utils/api/taskApi.js |
| `/founders/:param/milestones/:param` | GET | 1: utils/api/founderApi.js |
| `/founders/:param/posts` | GET | 1: utils/api/founderApi.js |
| `/founders/:param/posts/:param` | GET | 1: utils/api/founderApi.js |
| `/founders/:param/startup` | GET | 1: utils/api/founderApi.js |
| `/founders/:param/tasks` | GET | 3: utils/api/coreEngineApi.js, utils/api/founderApi.js, utils/api/taskApi.js |
| `/founders/:param/tasks/:param` | GET | 3: utils/api/coreEngineApi.js, utils/api/founderApi.js, utils/api/taskApi.js |
| `/founders/:param/tasks/:param/assign` | GET | 2: utils/api/coreEngineApi.js, utils/api/taskApi.js |
| `/founders/:param/tasks/:param/status` | GET | 2: utils/api/coreEngineApi.js, utils/api/taskApi.js |
| `/founders/:param/team-members` | GET | 1: utils/api/teamMemberApi.js |
| `/founders/:param/weekly-outcomes` | GET | 3: utils/api/coreEngineApi.js, utils/api/founderApi.js, utils/api/taskApi.js |
| `/founders/invitations` | GET | 1: utils/api/founderApi.js |
| `/founders/profile` | GET | 1: utils/api/founderApi.js |
| `/founders/profile/:param` | GET | 1: utils/api/founderApi.js |
| `/founders/startup` | GET | 1: utils/api/founderApi.js |
| `/founders/startup/:param` | GET | 1: utils/api/founderApi.js |
| `/google` | GET | 2: components/shared/GoogleAccountConnect.jsx, utils/googleMeet.js |
| `/health` | GET | 4: contexts/NotificationContext.jsx, utils/backendHealthCheck.js, utils/backendHealthCheck.jsx, utils/testBackendConnection.js |
| `/interests` | GET | 1: components/layout/AppLayoutHybrid.jsx |
| `/interests/:param` | GET | 1: utils/api/compensationApi.js |
| `/interests/:param/messages` | GET | 1: utils/api/inboxApi.js |
| `/interests/:param/onboard` | GET | 1: utils/api/inboxApi.js |
| `/interests/:param/status` | GET | 1: utils/api/inboxApi.js |
| `/interests/received/:param` | GET | 1: utils/api/inboxApi.js |
| `/interests/send` | GET | 2: domains/talent/hooks/useTalentHomeData.js, utils/api/inboxApi.js |
| `/interests/sent/:param` | GET | 2: domains/talent/hooks/useTalentHomeData.js, utils/api/inboxApi.js |
| `/invitations` | GET | 5: App.jsx, components/InvitationAcceptance.jsx, components/TeamMemberOnboarding.jsx, components/layout/AppLayoutHybrid.jsx, utils/api/inboxApi.js |
| `/invitations/:param` | GET | 2: components/InvitationAcceptance.jsx, utils/api/compensationApi.js |
| `/invitations/:param/messages` | GET | 1: utils/api/inboxApi.js |
| `/invitations/:param/respond` | GET | 2: utils/api/inboxApi.js, utils/api/organizationApi.js |
| `/invitations/:param/status` | GET | 2: utils/api/founderApi.js, utils/api/inboxApi.js |
| `/invitations/create` | GET | 1: utils/api/organizationApi.js |
| `/invitations/founder/:param` | GET | 2: utils/api/inboxApi.js, utils/api/organizationApi.js |
| `/invitations/received/:param` | GET | 2: domains/talent/hooks/useTalentHomeData.js, utils/api/inboxApi.js |
| `/invitations/send` | GET | 1: utils/api/inboxApi.js |
| `/invitations/sent/:param` | GET | 1: utils/api/inboxApi.js |
| `/invitations/token/:param` | GET | 1: utils/api/founderApi.js |
| `/meetings` | GET | 1: utils/api/meetingApi.js |
| `/meetings/:param` | GET | 1: utils/api/meetingApi.js |
| `/memberships/founder/:param` | GET | 1: utils/api/organizationApi.js |
| `/mentors` | GET | 1: pages/MentorLogin.jsx |
| `/mentors/:param` | GET | 4: components/mentor/MentorPortal.jsx, components/organizations/MentorAssignmentManager.jsx, components/organizations/MentorManager.jsx, utils/api/organizationApi.js |
| `/messages` | GET | 3: components/Inbox.jsx, components/founders/OrganizationMessaging.jsx, components/organizations/CommunicationCenter.jsx |
| `/messages/:param` | GET | 3: components/Inbox.jsx, components/founders/OrganizationMessaging.jsx, utils/messaging.js |
| `/messages/conversation/:param/:param/:param` | GET | 1: utils/messaging.js |
| `/messages/conversations/:param/:param` | GET | 1: utils/messaging.js |
| `/messages/direct/:param/:param` | GET | 1: utils/messaging.js |
| `/messages/mark-read` | GET | 1: utils/messaging.js |
| `/messages/send` | GET | 1: utils/messaging.js |
| `/messages/unread-count/:param/:param` | GET | 1: utils/messaging.js |
| `/migrations` | GET | 1: utils/migrations/orgInvitationMigration.js |
| `/notifications` | GET | 5: components/NotificationDebugPanel.jsx, contexts/NotificationContext.jsx, utils/eventNotifications.js, utils/eventReminders.js, utils/notificationTriggers.js |
| `/notifications/:param` | GET | 1: contexts/NotificationContext.jsx |
| `/organizations/:param` | GET | 5: components/organizations/MentorAssignmentManager.jsx, components/organizations/MentorManager.jsx, components/organizations/OrganizationSettings.jsx, utils/api/organizationApi.js, utils/eventNotificati… |
| `/organizations/:param/is-admin/:param` | GET | 1: utils/api/organizationApi.js |
| `/organizations/create` | GET | 1: utils/api/organizationApi.js |
| `/organizations/user/:param` | GET | 1: utils/api/organizationApi.js |
| `/presence` | GET | 2: utils/presenceApi.js, utils/testBackendConnection.js |
| `/presence/:param` | GET | 2: utils/api/teamMemberApi.js, utils/presenceApi.js |
| `/presence/:param/:param` | GET | 1: utils/presenceApi.js |
| `/startups/:param/announcements` | GET | 1: utils/announcementApi.js |
| `/startups/:param/polls` | GET | 1: utils/pollApi.js |
| `/startups/:param/polls/:param/close` | GET | 1: utils/pollApi.js |
| `/startups/:param/polls/:param/vote` | GET | 1: utils/pollApi.js |
| `/startups/:param/snapshot` | GET | 1: utils/api/organizationApi.js |
| `/talent` | GET | 1: components/TeamMatching.jsx |
| `/talent/:param/applications` | GET | 2: domains/talent/hooks/useTalentHomeData.js, utils/api/talentApi.js |
| `/talent/:param/matches` | GET | 1: utils/api/talentApi.js |
| `/talent/:param/saved` | GET | 2: domains/talent/hooks/useTalentHomeData.js, utils/api/talentApi.js |
| `/talent/:param/saved/:param/:param` | GET | 1: utils/api/talentApi.js |
| `/talent/:param/saved/startup/:param` | GET | 1: domains/talent/hooks/useTalentHomeData.js |
| `/talent/browse` | GET | 1: utils/api/talentApi.js |
| `/talent/opportunities` | GET | 1: utils/api/talentApi.js |
| `/talent/profile` | GET | 1: utils/api/talentApi.js |
| `/talent/profile/:param` | GET | 1: utils/api/talentApi.js |
| `/talent/startup-posts` | GET | 2: domains/talent/hooks/useTalentHomeData.js, utils/api/founderApi.js |
| `/team-members/:param` | GET | 2: components/AdminDebugDatabase.jsx, utils/api/offlineTaskApi.js |
| `/team-members/:param/activity` | GET | 1: utils/api/teamMemberApi.js |
| `/team-members/:param/leave` | GET | 1: utils/api/teamMemberApi.js |
| `/team-members/:param/performance` | GET | 1: utils/api/performanceApi.js |
| `/team-members/:param/status` | GET | 1: utils/api/teamMemberApi.js |
| `/team-members/:param/tasks` | GET | 2: utils/api/taskApi.js, utils/api/teamMemberApi.js |
| `/team-members/:param/tasks/:param/comments` | GET | 1: utils/api/teamMemberApi.js |
| `/team-members/profile` | GET | 1: utils/api/teamMemberApi.js |
| `/team-members/profile/:param` | GET | 1: utils/api/teamMemberApi.js |
| `/uploads` | GET | 1: utils/api/uploadApi.js |
| `/users/:param` | GET | 3: components/NotificationDebugPanel.jsx, contexts/NotificationContext.jsx, utils/api/userApi.js |
| `/users/:param/client-preferences` | GET | 1: utils/api/clientPreferencesApi.js |
| `/users/search-by-email` | GET | 1: utils/api/organizationApi.js |