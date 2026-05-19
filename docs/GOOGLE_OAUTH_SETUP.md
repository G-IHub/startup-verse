# Google Calendar / Meet OAuth setup (Phase 9.1)

Use this guide when enabling `GOOGLE_INTEGRATION_ENABLED=true` on the API server.

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**
   - User type: External (production) or Internal (Workspace only).
   - Add test users while in "Testing" mode.
   - Scopes to add:
     - `https://www.googleapis.com/auth/calendar.events`
     - `openid`
     - `email`
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs** (must match server exactly):
     - Local: `http://localhost:5000/api/v1/google/oauth/callback`
     - Staging/prod: `https://<your-api-host>/api/v1/google/oauth/callback`
5. Copy **Client ID** and **Client secret** into your server secret store (never commit).

## 2. Server environment

In `server/.env.local` (dev) or your host env (staging/prod):

```env
GOOGLE_INTEGRATION_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
# Optional — defaults to http://localhost:5000/api/v1/google/oauth/callback in development
# GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/v1/google/oauth/callback
# Optional — defaults to JWT_SECRET
# GOOGLE_OAUTH_STATE_SECRET=...
PUBLIC_APP_URL=http://localhost:5173
```

| Variable | Required when enabled | Notes |
|----------|----------------------|--------|
| `GOOGLE_INTEGRATION_ENABLED` | `true` | Default `false` — keeps 503/placeholder behavior |
| `GOOGLE_CLIENT_ID` | Yes | From OAuth client |
| `GOOGLE_CLIENT_SECRET` | Yes | From OAuth client |
| `GOOGLE_REDIRECT_URI` | Recommended in prod | Must match Console redirect URI |
| `GOOGLE_OAUTH_STATE_SECRET` | No | HMAC for OAuth `state`; defaults to `JWT_SECRET` |
| `PUBLIC_APP_URL` | Yes | Where users land after OAuth (`/settings?google=connected`) |

Restart the API after changing env.

## 3. User flow

1. User opens **Settings** → **Google Calendar Integration** → **Connect**.
2. Browser goes to `GET /api/v1/google/connect` (cookie auth).
3. User consents on Google; callback saves encrypted tokens.
4. Redirect to `{PUBLIC_APP_URL}/settings?google=connected`.
5. **Mentor Virtual Office** → instant Meet calls `POST /api/v1/google/instant-meeting/:userId`.

## 4. Manual QA

- [ ] With integration **off**: Connect UI shows disabled message; no 501 on happy path.
- [ ] With integration **on** + valid credentials: Connect → connected email shown.
- [ ] Disconnect clears status.
- [ ] Mentor instant Meet returns a `meet.google.com` link and opens in new tab.
- [ ] Wrong-user `GET /google/status/:otherUserId` returns 403.

## 5. Automated checks

```bash
cd server
npm run test:step-9-1-google
npm run test:step-5-2-501-compat
```

Live OAuth is not run in CI. After credentials exist, test manually on staging.
