# Phase 1 API Contract Lock

This document defines the canonical runtime API contract for Phase 1 alignment.

Decision precedence used:
1. Runtime backend routes in `server/src/routes/*`
2. Backend implementation plan
3. API parity matrix
4. Master blueprint (for conflict resolution)

Route state labels:
- `implemented`: fully callable in runtime backend
- `placeholder`: callable but intentionally non-final behavior
- `deferred`: planned but intentionally not implemented in Phase 1

## Global Contract

- Base path: `/api/v1/*`
- Success envelope: `{ "success": true, "data": ... }`
- Error envelope: `{ "success": false, "message": "...", "errors"?: [...] }`
- Auth: `Authorization: Bearer <token>` on protected routes

## Canonical Route Decisions (Resolved)

| Area | Canonical Method + Path | Auth | State | Notes |
|---|---|---|---|---|
| Auth account read | `GET /api/v1/auth/account/:userId` | Yes | implemented | Canonical read endpoint |
| Auth account delete | `DELETE /api/v1/auth/account/:userId` | Yes | implemented | Added to resolve doc/runtime conflict |
| Founder task update status | `PUT /api/v1/founders/:founderId/tasks/:taskId/status` | Yes | implemented | `PATCH` callers should migrate to `PUT` |
| Founder task assign | `PUT /api/v1/founders/:founderId/tasks/:taskId/assign` | Yes | implemented | Canonical task assignment route |
| Org admin add | `POST /api/v1/organizations/:orgId/admins` | Yes + org-admin | implemented | `/admins/add` remains compatibility alias |
| Org admin remove | `DELETE /api/v1/organizations/:orgId/admins/:adminUserId` | Yes + org-admin | implemented | `/remove` suffix remains compatibility alias |
| Org invitation token lookup | `GET /api/v1/invitations/token/:token` | No | implemented | Canonical token resolver |
| Org invitation respond | `POST /api/v1/invitations/:invitationId/respond` | Yes | implemented | Canonical accept/decline route |
| Founder announcements feed | `GET /api/v1/founder/:founderId/announcements` | Yes | implemented | Compatibility namespace retained for active client |
| Founder events feed | `GET /api/v1/founder/:founderId/events` | Yes | implemented | Compatibility namespace retained for active client |
| Notifications routes | `/api/v1/notifications/*` | Yes | implemented | Production behavior is implemented, not deferred |
| Google integration | `/api/v1/google/*` | Mixed | placeholder | Explicitly non-final integration behavior |

## Compatibility Policy (Phase 1)

- Compatibility aliases are allowed only to protect active runtime callers during migration.
- New/updated frontend callers must use canonical routes above.
- After migration + smoke checks, compatibility aliases should be reduced in Phase 2+.

## Phase 1 Contract Gate

Phase 1 is complete only when all are true:
- High-traffic frontend API callers parse canonical envelope (`success`, `data`, `message`, `errors`)
- No high-traffic runtime caller uses legacy vendor function URLs
- Canonical route decisions in this document match backend runtime code
- Contract smoke checks pass for mapped frontend routes
