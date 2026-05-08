# StartupVerse UI Contract Matrix (Phase 1 Lock)

This matrix is the contract guardrail for Phase 1.

- Source of truth:
  - Client entry components in `client/src/components/*`
  - Existing server routes in `server/src/routes/*`
- No guessed/future endpoints are listed.
- `phase_scope_tag` enforces the redesign boundary.

## Matrix Schema

Each row uses:
- `screen_id`
- `phase_scope_tag` (`core-role` | `excluded-phase2`)
- `entry_component`
- `user_role`
- `primary_endpoints`
- `ownership_guard` (`self/admin` | `startup` | `org`)
- `realtime_dependency`
- `fallback_mode`

## Endpoint-to-Screen Matrix

| screen_id | phase_scope_tag | entry_component | user_role | primary_endpoints | ownership_guard | realtime_dependency | fallback_mode |
|---|---|---|---|---|---|---|---|
| founder-dashboard | core-role | `client/src/components/dashboards/FounderDashboard.jsx` | founder | `GET/POST /founders/:founderId/weekly-outcomes`<br>`GET/POST /founders/:founderId/tasks`<br>`PUT/PATCH /founders/:founderId/tasks/:taskId/status`<br>`PUT/PATCH /founders/:founderId/tasks/:taskId/assign`<br>`DELETE /founders/:founderId/tasks/:taskId`<br>`GET/POST /founders/:founderId/milestones`<br>`DELETE /founders/:founderId/milestones/:milestoneId`<br>`GET /execution-score/:userId` | self/admin | no (page data is REST-driven) | REST refresh + cached local fallback in existing client helpers |
| team-member-home | core-role | `client/src/components/dashboards/TeamMemberDashboard.jsx` | team-member | `GET /team-members/:teamMemberId/tasks`<br>`PUT /team-members/:teamMemberId/tasks/:taskId`<br>`GET/POST /team-members/:teamMemberId/status`<br>`GET /calendar/:userId`<br>`GET /presence/:startupId` | self/admin + startup | low (presence is realtime-capable, page remains REST-first) | Backend-first REST with local task/user cache fallback only when backend requests fail |
| team-member-performance | core-role | `client/src/components/team-member/MyPerformancePage.jsx` | team-member | `GET /team-members/:teamMemberId/performance`<br>`GET /team-members/:teamMemberId/tasks` | self/admin | no (REST metrics) | Backend-first REST with task fallback when performance or task requests fail |
| talent-home | core-role | `client/src/components/dashboards/TalentDashboard.jsx` + `client/src/domains/talent/hooks/useTalentHomeData.js` | talent | `GET /talent/startup-posts`<br>`GET /talent/:talentId/saved`<br>`POST /talent/:talentId/saved`<br>`DELETE /talent/:talentId/saved/:itemType/:itemId`<br>`GET /interests/sent/:talentId`<br>`POST /interests/send`<br>`GET /invitations/received/:talentId` | self/admin | no | Backend-first REST with cached local fallback only on request failure |
| talent-browse-entry | core-role | `client/src/components/layout/VerticalSidebar.jsx` -> `client/src/components/DashboardHybrid.jsx` (`dashboard` opportunities mode) | talent | `GET /talent/startup-posts`<br>`GET /talent/:talentId/saved`<br>`GET /interests/sent/:talentId` | self/admin | no | Delegates to `talent-home`; no second full browse implementation |
| virtual-office-workspace | core-role | `client/src/components/office/VirtualStartupOfficeWorkspaceV2.jsx` | founder, team-member | `POST /presence/update`<br>`GET /presence/:startupId`<br>`GET/POST /startups/:startupId/activities`<br>`GET/POST /startups/:startupId/wins`<br>`POST /messages/send`<br>`GET /messages/conversation/:startupId/:userId/:otherUserId`<br>`GET /messages/conversations/:startupId/:userId`<br>`POST /messages/mark-read`<br>`GET /agenda/:startupId`<br>`GET /calendar/:userId` | startup (with self/admin checks on user-scoped mutations) | yes (`presence`, `activity`, `wins`, `messages`, `tasks`) | Socket fallback to bounded polling + REST requests |
| inbox | core-role | `client/src/components/Inbox.jsx` | founder, talent, team-member | `GET /invitations/founder/:founderId`<br>`POST /invitations/:invitationId/respond`<br>`POST /invitations/send`<br>`GET /invitations/sent/:founderId`<br>`GET /invitations/received/:talentId`<br>`PUT /invitations/:invitationId/status`<br>`POST /invitations/:invitationId/messages`<br>`POST /interests/send`<br>`GET /interests/received/:founderId`<br>`GET /interests/sent/:talentId`<br>`PUT /interests/:interestId/status`<br>`POST /interests/:interestId/messages`<br>`POST /interests/:interestId/onboard`<br>`GET /messages/:userId` | self/admin (plus startup scope on conversation routes) | partial (message updates can be realtime) | Manual refresh + REST fetch; cached/local fallback paths remain |
| notification-center | core-role | `client/src/components/notifications/NotificationCenter.jsx` + `client/src/contexts/NotificationContext.jsx` | founder, team-member, talent | `GET/DELETE /users/:userId/notifications`<br>`POST /users/:userId/notifications/mark-all-read`<br>`PUT /notifications/:notificationId/read`<br>`POST /notifications` | self/admin | partial (server emits realtime notifications) | Context polling + local cache when backend unavailable |
| analytics-dashboard | core-role | `client/src/components/analytics/AnalyticsDashboard.jsx` | founder | `GET /founders/:founderId/analytics`<br>`GET /execution-score/:userId` | self/admin | no | Timed REST refresh loop |
| settings | core-role | `client/src/components/SettingsPage.jsx` + `client/src/components/ProfilePage.jsx` | founder, team-member, talent | `PUT /auth/profile/:userId`<br>`DELETE /auth/account/:userId`<br>`GET /users/:userId`<br>`GET/PUT /users/:userId/notification-preferences` | self/admin | no | Form-state fallback + local preference storage |
| organization-dashboard | excluded-phase2 | `client/src/components/dashboards/OrganizationDashboard.jsx` | organization-admin | `POST /organizations/create`<br>`GET /organizations/user/:userId`<br>`GET /organizations/:orgId`<br>`PUT /organizations/:orgId/update`<br>`POST /cohorts/create`<br>`GET /cohorts/organization/:orgId`<br>`GET /cohorts/:cohortId`<br>`DELETE /cohorts/:cohortId` | org | mixed (org messaging/announcements can be realtime) | not part of Phase 1 redesign; keep current behavior unchanged |

## Validation Notes

- The row set above is used as the Phase 1 contract gate:
  - every `core-role` row must keep valid server-backed endpoints,
  - every row has an ownership guard classification,
  - realtime rows define explicit fallback behavior,
  - `excluded-phase2` rows must not enter phase-1 migration backlog.
