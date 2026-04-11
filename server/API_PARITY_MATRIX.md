# API Parity Matrix (Client Runtime -> Express API)

Last updated: 2026-04-03

Envelope standard:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "message": "...", "errors"?: [...] }`

## Matrix

| Route Prefix / Endpoint Family | Classification | Auth | Request Shape (summary) | Response Shape | Status |
|---|---|---|---|---|---|
| `/health` | Canonical | No | none | service health metadata | Implemented |
| `/auth/*` (`signup`, `signin`, `profile/:id`, `account/:id` GET+DELETE) | Canonical | Mixed | credentials/profile/account payloads | user + token / user profile / account delete ack | Implemented |
| `/users/*` (`:id`, `search-by-email`) | Canonical | Yes | `userId` or `email` | user/search result | Implemented |
| `/users/:id/notifications*` + `notification-preferences` | Compatibility alias | Yes | user-scoped payloads | notifications/preferences | Implemented |
| `/founders/*` | Canonical | Yes | founder/startup/task/milestone/outcome payloads | founder domain records | Implemented |
| `/founder/:founderId/events` | Compatibility alias | Yes | none | founder events list | Implemented |
| `/founder/:founderId/announcements` | Compatibility alias | Yes | none | founder announcements list | Implemented |
| `/team-members/*` | Canonical | Yes | profile/task/status payloads | profile/tasks/status/performance | Implemented |
| `/talent/*` | Canonical | Yes | profile/application/saved payloads | talent records | Implemented |
| `/organizations/*` + `/cohorts/*` | Canonical | Yes | org/cohort/admin payloads | org/cohort/admin records | Implemented |
| `/invitations/*` | Canonical | Yes (except token lookup) | invitation payloads | invitation records | Implemented |
| `/interests/*` | Canonical | Yes | interest payloads | interest records | Implemented |
| `/deliverables/*` | Canonical | Yes | deliverable/submission payloads | deliverable/submission records | Implemented |
| `/messages/*` | Canonical | Yes | message payloads | message records/unread stats | Implemented |
| `/notifications/*` | Canonical | Yes | notification payloads | notification records | Implemented |
| `/agenda/*` + `/calendar/:userId` | Canonical | Yes | startup/user context | aggregated schedule data | Implemented |
| `/execution-score/:userId` | Canonical | Yes | none | derived execution score | Implemented |
| `/presence/*` | Canonical | Yes | presence update payload | presence records | Implemented |
| `/google/*` | Canonical placeholder | Yes/Mixed | oauth/meeting payloads | placeholder integration data | Placeholder |
| `/cron/*` | Compatibility alias | Yes | trigger payloads | trigger acknowledgement | Implemented |
| `/mentors/*` | Compatibility alias | Mixed | mentor/token/assignment payloads | mentor/assignment records | Implemented |
| `/events/*` | Compatibility alias | Yes | event/rsvp payloads | event records | Implemented |
| `/announcements/*` | Compatibility alias | Yes | announcement payloads | announcement records | Implemented |
| `/resources/*` | Compatibility alias | Yes | resource payloads | resource records | Implemented |
| `/program-milestones/*` | Compatibility alias | Yes | milestone payloads | program milestone records | Implemented |
| `/analytics/*` | Compatibility alias | Yes | entity/cohort context | summary metrics | Implemented |
| `/portfolio/*` | Compatibility alias | Yes | cohort context | cohort portfolio health summary | Implemented |
| `/kv/get` | Compatibility alias | Yes | query `key` | placeholder key/value response | Implemented |
| `/debug/startup/:startupId` | Compatibility alias | Yes | startup context | startup debug summary | Implemented |
| `/admin/stats` | Compatibility alias | Yes | none | aggregate counts | Implemented |
| `/admin/clear-all-data` | Compatibility alias | Yes | none | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |
| `/admin/nuclear-reset` | Compatibility alias | Yes | none | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |
| `/admin/mega-nuclear-reset` | Compatibility alias | Yes | none | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |
| `/emails/*` | Compatibility alias | Yes | email payloads | placeholder send ack | Implemented |
| `/migrate/*` + `/migrations/*` | Compatibility alias | Yes | migration payloads | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |

## Notes

- Compatibility endpoints include deprecation metadata in payload under `_compat` where applicable.
- Destructive compatibility endpoints are intentionally disabled and return deterministic `501` responses.