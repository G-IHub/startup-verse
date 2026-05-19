# 501 / compat-not-implemented route audit (Step 5.2 / X8)

**Last updated:** Phase 9.1 — Google OAuth implemented when `GOOGLE_INTEGRATION_ENABLED=true` and credentials configured.

Product emails and calendar/meet flows use domain routes — not generic compat stubs.

## Server routes returning 501

| Route | Method | When | Server file | Resolution |
|-------|--------|------|-------------|------------|
| `/admin/clear-all-data` | POST | Always | `admin.routes.js` | Keep 501 (intentional guard). Client: no wipe button (Step 5.2). |
| `/admin/nuclear-reset` | POST | Always | `admin.routes.js` | Keep 501. Orphan client components removed. |
| `/admin/mega-nuclear-reset` | POST | Always | `admin.routes.js` | Keep 501. Orphan client components removed. |

## Google routes (Phase 9.1)

When `GOOGLE_INTEGRATION_ENABLED=false` (default): `GET /google/status` returns `placeholder: true`; connect/meet return **503** with disabled message.

When enabled **and** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / redirect URI configured:

| Route | Behavior |
|-------|----------|
| `GET /google/status/:userId` | Real connection status |
| `GET /google/connect` | Redirect to Google OAuth (use this from client, not `/oauth/authorize` string in UI) |
| `GET /google/oauth/callback` | OAuth callback (register in Google Cloud Console) |
| `POST /google/instant-meeting/:userId` | Calendar event + Meet link |
| `POST /google/create-meeting` | Scheduled event + Meet link |
| `POST\|DELETE /google/disconnect/:userId` | Revoke + delete tokens |

Setup: [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md)

## Routes that are NOT 501 (happy path)

| Route | Notes |
|-------|--------|
| `GET /google/status/:userId` | 200 — `placeholder` when integration off or misconfigured |
| `GET /calendar/:userId` | 200 — internal agenda timeline (not Google Calendar API) |
| `GET /admin/stats` | 200 — admin stats card |

## Client changes (Phase 5.2 + 9.1)

| File | Change |
|------|--------|
| `SettingsPage.jsx` | `AdminDatabaseClear` admin-only |
| `GoogleAccountConnect.jsx` | Connect via `GET /google/connect`; OAuth return query handling |
| `googleMeet.js` | `POST /google/instant-meeting/:userId` when connected |
| `MentorPortal.jsx` | Virtual Office Meet when `meetAvailable && connected` |

## Regression

```bash
cd server && npm run test:step-5-2-501-compat
cd server && npm run test:step-9-1-google
```
