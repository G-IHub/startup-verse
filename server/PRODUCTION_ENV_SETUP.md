# Production environment setup

Set variables on your **API host** (not in git). The React app needs **`VITE_API_URL` at build time** on your **frontend host**.

## 1. Your URLs (StartupVerse on Railway)

| Role | URL | Env vars |
|------|-----|----------|
| Frontend | `https://www.startupverse.space` (and apex if used) | `PUBLIC_APP_URL`, `CORS_ORIGIN` |
| API | `https://api.startupverse.space` | `VITE_API_URL` = `https://api.startupverse.space/api/v1` |

Copy-paste templates:

- API (Railway): [`server/.env.production.railway.template`](.env.production.railway.template)
- Client build: [`client/.env.production.template`](../client/.env.production.template)

If users can open both `www` and apex, keep both in `CORS_ORIGIN` (see template). Prefer one canonical URL in `PUBLIC_APP_URL` (apex is fine).

`startupverse.space` + `api.startupverse.space` share the same site (registrable domain), so HttpOnly cookies work with `credentials: include`.

**CORS login failures:** If the browser shows “blocked by CORS policy” from `https://www.startupverse.space`, Railway `CORS_ORIGIN` must list that exact origin (and `https://startupverse.space` if users can open apex). `www` and non-`www` are different origins.

## 2. Server (API) — required

Copy [`server/.env.example`](.env.example) and fill in (or paste into Railway/Render/Fly env UI):

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://app.yourdomain.com
JWT_SECRET=<new 48+ byte random secret>
JWT_EXPIRES_IN=7d
MONGODB_CONNECTION_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
PUBLIC_APP_URL=https://app.yourdomain.com
```

**MongoDB:** Create a production Atlas cluster (or DB), user with read/write on that DB, network access for your API server IP (or `0.0.0.0/0` only if your host has no fixed IP — tighten when possible).

**JWT:** Generate a **new** secret for production. Do not copy from `.env.local`.

**CORS:** Exact frontend origin(s), comma-separated if you have staging + prod frontends.

## 3. Server — email (Mailtrap **Sending**, not sandbox)

1. In [Mailtrap](https://mailtrap.io) → **Sending Domains** → add and verify `startupverse.com` (DNS records).
2. **Email Sending** → **SMTP** → copy the **API token** (not sandbox credentials).
3. Set on Railway:

```env
EMAIL_TRANSPORT=smtp
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=<your Mailtrap Sending API token>
EMAIL_FROM=StartupVerse <noreply@startupverse.com>
```

After deploy, send a cohort invite or use the admin email test route and confirm delivery in Mailtrap’s Sending logs.

## 4. Railway — API service

1. New service from repo root `server/` (or monorepo with root directory `server`).
2. **Variables**: paste from `.env.production.railway.template` (fill placeholders).
3. **Networking**: generate domain `api.startupverse.com` → add CNAME in DNS to Railway.
4. **Start command**: `npm run start` (or `node src/index.js` per your `package.json`).
5. Railway injects `PORT` — you usually do **not** need to set `PORT` manually.

Generate `JWT_SECRET` locally (do not reuse dev):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 5. Client (frontend) — build-time

On Railway static site, Vercel, Netlify, etc., set **before** `npm run build`:

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_INCLUDE_COMPENSATION_DEMO=false
VITE_VERBOSE_CONSOLE=false
```

See [`client/.env.example`](../client/.env.example). Rebuild and redeploy whenever the API URL changes.

## 6. Checklist before go-live

- [ ] `npm run verify:release` passes in CI/staging (optional: `VERIFY_HTTP_FLOWS=1` with staging Mongo)
- [ ] `GET https://api.yourdomain.com/api/v1/health` returns 200
- [ ] Sign up / sign in from production frontend (cookie auth)
- [ ] Cohort invite email arrives (not log-only)
- [ ] Manual QA: [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md)

## 7. What not to do

- Do not commit `.env`, `.env.local`, or production secrets
- Do not use dev `JWT_SECRET` or dev Mongo URI in production
- Do not set `CORS_ORIGIN` to the API URL — it must be the **browser app** origin
