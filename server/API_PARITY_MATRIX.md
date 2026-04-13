# API Parity Matrix (Client Runtime -> Express API)

Last updated: 2026-04-13

Envelope standard:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "message": "...", "errors"?: [...] }`

## Phase 1 — API contract lock (inventory + gates)

- **Product SoT:** [`startup-verse_master_blueprint.md`](../startup-verse_master_blueprint.md) — process docs under `docs/` were removed; use [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) for manual release checks.
- **Generated client inventory:** [`API_CLIENT_CALL_INVENTORY.md`](./API_CLIENT_CALL_INVENTORY.md) — `npm run export:client-api-inventory` from `server/` after client API edits.
- **Single API origin (client):** `client/src/config/apiBase.js` exports `API_BASE_URL`; prefer this over duplicating `VITE_API_URL` literals.
- **Alignment gate (`npm run test:alignment-gate`):**
  - `phase1-contract-smoke` — canonical route string checks.
  - `phase1-envelope-all-controllers-smoke` — every `*.controller.js` uses `apiResponse` (no raw `res.json`).
  - `phase1-client-api-inventory-smoke` — client path scan not collapsed (min count + required prefixes).
  - `phase1-client-server-route-smoke` — first URL segment of each scanned client path exists on server routes **or** is listed as a documented orphan in that script (pending Express parity).
  - `phase1-http-api-envelope-smoke` — supertest against mounted `app` for `/api/v1/health` + 404 envelope (no DB).
  - `phase1-http-contract-flows-smoke` — when `RUN_CONTRACT_HTTP_FLOWS=1`: signup + authenticated `GET /talent/startup-posts` + `401` / cross-user `403` sample (requires Mongo + full env).
  - `phase4-realtime-alignment-smoke` — Socket.IO client/server contract + message REST fallback.
  - `phase5-legacy-hosted-smoke` — no banned vendor-hosted URL substrings under `client/src` + `server/src`.
  - `phase5-compat-zero-smoke` — `compatibility.routes.js` removed; `emails` / `admin` / `migrations` routers mounted from `routes/index.js`.
  - `phase6-blueprint-gap-smoke` — Google placeholders, unified `GET /calendar/:userId`, notifications emit + reminder queue wiring, password `select: false`.
  - `phase8-security-alignment-smoke` — static checks for `sanitizeUser`, `requireOrgAdmin` on sensitive routers.
  - `phase9-remediation-readiness-smoke` — weekly-loop status stability, onboarding transaction, ownership guards, score/streak contract, activity immutability, presence TTL.
- **Artifacts:** `API_CLIENT_CALL_CATALOG.json`, `API_ROUTE_MAPPING.generated.md`, `API_SERVER_ROUTE_MANIFEST.generated.md` (regenerate via `npm run export:*` in `server/`).

## Matrix

| Route Prefix / Endpoint Family | Classification | Auth | Request Shape (summary) | Response Shape | Status |
|---|---|---|---|---|---|
| `/health` | Canonical | No | none | service health metadata | Implemented |
| `/auth/*` (`signup`, `signin`, `profile/:id`, `account/:id` GET+DELETE) | Canonical | Mixed | credentials/profile/account payloads | user + token / user profile / account delete ack | Implemented |
| `/users/*` (`:id`, `search-by-email`) | Canonical | Yes | `userId` or `email` | user/search result | Implemented |
| `/users/:id/notifications*` + `notification-preferences` | Compatibility alias | Yes | user-scoped payloads | notifications/preferences | Implemented |
| `/founders/*` | Canonical | Yes | founder/startup/task/milestone/outcome payloads | founder domain records | Implemented |
| `/founder/:founderId/events` | Canonical (founders router) | Yes | none | founder events list | Implemented |
| `/founder/:founderId/announcements` | Canonical (founders router) | Yes | none | founder announcements list | Implemented |
| `/team-members/*` | Canonical | Yes | profile/task/status payloads | profile/tasks/status/performance | Implemented |
| `/talent/*` | Canonical | Yes | profile/application/saved payloads | talent records | Implemented |
| `/organizations/*` + `/cohorts/*` | Canonical | Yes | org/cohort/admin payloads | org/cohort/admin records | Implemented |
| `/invitations/*` | Canonical | Yes (except token lookup) | invitation payloads | invitation records | Implemented |
| `/interests/*` | Canonical | Yes | interest payloads | interest records | Implemented |
| `/deliverables/*` | Canonical | Yes | deliverable/submission payloads | deliverable/submission records | Implemented |
| `/messages/*` | Canonical | Yes | message payloads | message records/unread stats | Implemented |
| `/notifications/*` | Canonical | Yes | notification payloads | notification records | Implemented |
| `/agenda/*` + `/calendar/:userId` | Canonical | Yes | startup/user context | `calendar`: events + deliverables + `programMilestones` + sorted `timeline` (`meetings: []` until modeled) | Implemented |
| `/execution-score/:userId` | Canonical | Yes | none | derived execution score | Implemented |
| `/presence/*` | Canonical | Yes | presence update payload | short-lived presence records (TTL-evicted) | Implemented |
| `/startups/:startupId/activities` | Canonical | Yes | startup-scoped activity create/list (`message`, `type`, optional metadata) | canonical activity DTO (`id`,`startupId`,`userId`,`userName`,`type`,`message`,`icon`,`timestamp`,`metadata`) | Implemented |
| `/google/*` | Canonical placeholder | Yes/Mixed | oauth/meeting payloads | placeholder integration data | Placeholder |
| `/cron/*` | Canonical | Yes | trigger payloads | trigger acknowledgement | Implemented |
| `/mentors/*` | Canonical | Mixed | mentor/token/assignment payloads | mentor/assignment records | Implemented |
| `/events/*` | Canonical | Yes | event/rsvp payloads | event records | Implemented |
| `/announcements/*` | Canonical | Yes | announcement payloads | announcement records | Implemented |
| `/resources/*` | Not mounted (legacy compat only) | — | — | — | **Removed** with `compatibility.routes.js` |
| `/program-milestones/*` | Not mounted standalone | — | prefer `/cohorts/:id/program-milestones` on organizations router | — | Use org routes |
| `/analytics/*` | Partially superseded | Yes | cohort analytics on `/cohorts/:id/analytics/overview` | metrics | Prefer org cohort routes |
| `/portfolio/*` | Not mounted | — | — | — | **Removed** |
| `/kv/get` | Not mounted | — | — | — | **Removed** |
| `/debug/startups/:startupId` | Canonical | Yes | none | startup debug summary | [`debug.routes.js`](./src/routes/debug.routes.js) |
| `/admin/stats` | Canonical | Yes + admin | none | aggregate counts + extended stats object | [`admin.routes.js`](./src/routes/admin.routes.js) |
| `/admin/reminder-delivery-metrics` | Canonical | Yes + admin | none | reminder job queue counts | [`admin.routes.js`](./src/routes/admin.routes.js) |
| `/admin/clear-all-data` | Canonical | Yes + admin | none | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |
| `/admin/nuclear-reset` | Canonical | Yes + admin | none | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |
| `/admin/mega-nuclear-reset` | Canonical | Yes + admin | none | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | Implemented |
| `/emails/*` | Canonical | Yes | email payloads | placeholder send ack | [`emails.routes.js`](./src/routes/emails.routes.js) |
| `/migrate/*` + `/migrations/*` | Canonical | Yes + admin | migration payloads | deterministic 501 with `COMPAT_NOT_IMPLEMENTED` | [`migrations.routes.js`](./src/routes/migrations.routes.js) |

## Compatibility router removal (2026-04-11)

The monolithic [`compatibility.routes.js`](./src/routes/compatibility.routes.js) file was **deleted**. Former compat-only surface area is either **canonical dedicated routers** (already registered before the compat mount) or **split** into:

- [`emails.routes.js`](./src/routes/emails.routes.js)
- [`admin.routes.js`](./src/routes/admin.routes.js)
- [`migrations.routes.js`](./src/routes/migrations.routes.js)

Client paths such as `/founder/:id/events`, `/events/upcoming`, `/mentors/*`, and `/announcements/.../mark-read` are served by **`founders.routes.js`**, **`events.routes.js`**, **`mentors.routes.js`**, and **`announcements.routes.js`** respectively (not the deleted compat module).

## Notes

- Destructive admin endpoints remain deterministic `501` with `COMPAT_NOT_IMPLEMENTED`.