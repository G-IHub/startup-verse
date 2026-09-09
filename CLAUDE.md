# StartupVerse V2 — Project Memory

**Repo:** `startup-verse-v2` · **Active branch:** `v2-autonomous-os`
**What this is:** MERN-ish app (React/Vite client + Node/Express server) for African founders to run structured weekly execution. Full product vision: [docs/startup-verse_master_blueprint.md](docs/startup-verse_master_blueprint.md). Screen-by-screen backend readiness: [V2_FRONTEND_BACKEND_MAPPING.md](V2_FRONTEND_BACKEND_MAPPING.md).

This file is the persistent memory for this project. Read it at the start of every session. Keep it current — see the SOP below.

---

## ⭐ STANDING OPERATING PROCEDURE (applies to every session — read this first)

1. **Discuss before implementing.** When a problem or idea comes up, diagnose it, present findings + a recommendation with tradeoffs, and WAIT for explicit confirmation ("yes" / "let's do it" / "proceed") before writing any code. Do not jump straight to a fix just because the diagnosis is clear. If the user says "let's discuss" or asks a question, that is not an instruction to implement.
2. **New capability = a new small file, not more logic folded into the shared hubs.** The shared hubs in this repo are: `client/src/App.jsx` (routing), `client/src/components/V2DashboardShell.jsx` (V2 screen router), `server/src/app.js` / `server/src/index.js` (server bootstrap). A new V2 screen gets its own file under `client/src/components/dashboards/`; a new backend capability gets its own route/controller/service file under `server/src/routes|controllers|services/` — the hubs import and wire in the new module, they don't absorb its logic. Prefer pure additions (new components, new routes, new store fields) over editing existing logic in place. Before touching a shared path (a Zustand store used by multiple screens, `App.jsx` routing, `V2DashboardShell.jsx`, realtime/socket wiring, auth middleware), explicitly check what else depends on it first.
3. **New state goes into one documented place, never a new scattered flag.** Client state lives in the Zustand stores under `client/src/state/` (`useHomeStore`, `useExecutionScoreStore`, `useWeeklyLoopStore`, `useTeamStore`, `useJourneyStore`, etc.) — reuse an existing store's fields where the data already exists (this is how V2FounderDashboard and V2ExecutionEngine were built: zero new API calls, all existing stores). A genuinely new piece of state gets a field on the relevant existing store, or a new store file if it's a new domain — never a stray `useState` duplicating server state, and never a new ad-hoc module-level variable.
4. **A prompt steer is a suggestion; escalate to a structural guard the moment it fails.** The model can ignore an instruction. Anything that must always hold — never call an API with a stale/missing founderId, never double-submit a weekly outcome, never render a V2 screen without its store initialized — gets backed by actual code (guards, disabled states, effect deps) the first time a steer-only fix is shown not to hold, not "maybe next time."
5. **Verify before concluding, especially "is this already broken / already fixed."** When asked to check whether something is an issue, ground the answer in real evidence (server logs, code on disk, a live browser check, `git log`/`git diff`) before proposing a fix — don't fix based on a guess or an old report. If evidence is inconclusive, say so honestly rather than assuming a bug exists.
6. **Nothing is "done" until it's actually verified working — not just written.** Run `npm run build` (client) after any client change touching routing/imports, and manually exercise the changed screen in the browser before calling it done. This is the actual mechanism that catches a fix silently breaking something else, rather than someone happening to notice it later.
7. **Relaunch/refresh after every code change that needs it.** For frontend changes, confirm Vite HMR picked it up (or restart `npm run dev`) and hard-refresh the browser before considering a change "live." For backend changes, confirm the server restarted cleanly with no errors before testing against it.
8. **Keep the Session Log current.** Log meaningful work with enough detail (what was built/fixed, root cause if it was a bug, files touched, how it was verified, what's still unverified) that a future session — on any account — can pick up the thread without re-deriving context.
9. **Keep a real, maintained "Current State" section — edited in place, not just appended to.** The Session Log is a historical record; Current State is what a future session reads first and trusts, corrected whenever something actually changes rather than left to quietly go stale.
10. **Commit at the end of each distinct piece of work.** Not aspirationally atomic — just regular, so `git log`/`git diff` can actually answer "what changed" when something breaks, instead of the answer being buried in one giant batch.
11. **Compact only at a natural breakpoint — after a piece of work is done, or during a genuine lull — never mid-task.** The "Compact" hint is a harness-level UI nudge tied to context size, not an instruction to act on immediately. Before agreeing to compact (or proactively suggesting it), check: is there a half-finished fix, an unverified change, or a pending decision the user hasn't confirmed? If so, say so plainly ("hold off — we're mid-fix on X, let's finish and verify first") rather than compacting through it. The trigger for "now is safe" is the same one as rule 10 — a distinct piece of work just got verified/committed/logged, or the conversation has genuinely paused. **Whenever compaction happens (user-initiated or auto), this file's Session Log + Current State must already be current** — compaction summarizes away the raw conversation, and this file is what survives it into the next session.

---

## Architecture Map

```
startup-verse-v2/
├── client/                       React + Vite frontend
│   ├── src/App.jsx                ← routing hub (V1 + V2 routes both live here)
│   ├── src/app/dashboardPaths.js  ← route-path constants + auth-guard prefix list
│   ├── src/state/                 ← Zustand stores (single source of truth for client state)
│   ├── src/components/
│   │   ├── dashboards/            ← screen-level components, V1 and V2 (V2* prefix)
│   │   ├── layout/                ← V2AppLayout, V2Sidebar (V2 3-col shell)
│   │   ├── shared/                ← v2-primitives.jsx (V2Card, V2Chip, V2ScoreRing, etc.)
│   │   └── V2DashboardShell.jsx   ← V2 screen router, mounted at /v2/*
│   └── domains/                   ← founder, office, presence, talent, team-member
└── server/                        Node/Express backend
    └── src/
        ├── app.js, index.js       ← server bootstrap
        ├── routes/ controllers/ services/ models/ domain/
        └── realtime/              ← Socket.IO (presence, activity feed, calls)
```

**V1 vs V2:** V2 is a parallel design system + screen set being built alongside V1, reusing V1's backend and Zustand stores. V1 screens/components must never be modified as a side effect of V2 work — confirmed zero-modification so far (`FounderDashboard.jsx`, `FounderMetricsRow.jsx`, `FounderHomeHero.jsx` etc. untouched).

---

## Current State
*(edit this section in place — it should always reflect reality, not history)*

- **Branch:** `v2-autonomous-os`. Journey stage tracker work (see latest Session Log entry) is uncommitted — **needs a commit**.
- **V2 mockup-fidelity plan, 3 phases:** (1) top bar — ✅ done, committed `0dfaaeb`. (2) Dashboard-specific gaps — 🟡 in progress: Founder Journey stage tracker done (this session, uncommitted); Cohort Rank tile, Cohort Leaderboard card, and AI Staff roster card are explicitly **deferred, not skipped** — all three need backend that doesn't exist yet (no leaderboard/ranking endpoint, no AIStaffRole model). User said to build that backend "when we get there" — don't build fake/placeholder data for these in the meantime. (3) Execution-Engine-specific gaps — not started: week tabs, 7-step loop visual, blocker callout, right-panel AI suggestion + task-load bars.
- **⚠️ Authoritative visual reference exists and was previously missed:** `Startupverse/Startupverse latest version/*.html` (one directory up from this repo) contains detailed, pixel-specific HTML/CSS mockups for every V2 screen (`StartupVerse_Dashboard_v2(1).html`, `StartupVerse_Execution_Engine.html`, `StartupVerse_Virtual_Office(2).html`, `StartupVerse_Cohort_View.html`, `StartupVerse_Startup_Profile.html`, `StartupVerse_AI_Staff.html`, `StartupVerse_AI_Staff_Chat.html`, `StartupVerse_Blueprint_Library.html`, `StartupVerse_Blueprint_Detail.html`, `StartupVerse_Mentor_Marketplace.html`, `StartupVerse_Mentor_Profile.html`, `StartupVerse_Onboarding.html`, `StartupVerse_Investor_View.html`). **Read the relevant mockup file(s) before building or reviewing ANY V2 screen** — the initial V2 build (dashboard + execution engine, first 3 commits) was done without referencing these and diverged structurally in real ways (see "Mockup fidelity" Session Log entry below for the specific gaps found). Don't repeat that mistake on the remaining screens.
- **V2 routes live at `/v2/*`** via `V2DashboardShell.jsx`, confirmed rendering correctly in a real browser as of 2026-09-09:
  | Path | Screen | Status |
  |---|---|---|
  | `/v2` | V2FounderDashboard | ✅ Full, visually verified |
  | `/v2/execution` | V2ExecutionEngine | ✅ Full, visually verified |
  | `/v2/office` | Virtual Office | 🔜 Stub ("Coming Soon") |
  | `/v2/community` | Community/Cohort | 🔜 Stub |
  | `/v2/journey` | Journey Stages | 🔜 Stub |
  | `/v2/ai-staff` | AI Staff | 🔜 Stub |
  | `/v2/blueprints` | Blueprint Library | 🔜 Stub |
  | `/v2/mentors` | Mentors | 🔜 Stub |
- **Local dev environment is fully stood up and this is now the default way to test:**
  - MongoDB Community 8.3.9 runs as a **portable binary** (no admin rights, no Windows service) at `C:\Users\Owner\Documents\Startupverse\mongodb-local\mongodb-win32-x86_64-windows-8.3.9\bin\mongod.exe --dbpath ./data/db --port 27017`. Start it manually if not running (`Get-NetTCPConnection -LocalPort 27017` to check).
  - Backend: `server/.env` (gitignored, dev-only secrets — NOT the production ones) has `NODE_ENV=development`, `PORT=5000`, `CORS_ORIGIN=http://localhost:3000`, a locally-generated `JWT_SECRET`, `MONGODB_CONNECTION_URI=mongodb://127.0.0.1:27017/startupverse_dev`. Run with `cd server && npm run dev` (nodemon, auto-restarts on `src/**` changes).
  - Frontend: `client/.env.local` has `VITE_API_URL=http://localhost:5000/api/v1` (points at the **local** backend, not production — this was deliberately changed away from production, see Session Log). Run with `cd client && npm run dev` → `http://localhost:3000`. Vite only reads `.env.local` at startup — restart after editing it.
  - `.claude/launch.json` (at the outer `Startupverse/` folder, not inside `startup-verse-v2/` — the Browser-pane tool resolves launch configs relative to the outer working directory) has a `startupverse-v2-client` entry for `preview_start`.
  - This gives a fully isolated local stack (Mongo + API + client) with zero contact with production — safe to freely sign up test accounts, submit forms, etc.
- **Do NOT point local dev at the production API again.** Production's auth cookie is `sameSite: "strict"` in production ([server/src/utils/sendToken.js:18](server/src/utils/sendToken.js)), which categorically cannot work cross-site from `localhost` — this was tried and hit a wall (see Session Log). Fixing that would require loosening production's cookie policy for all real users, which was intentionally deferred rather than done reflexively.
- **Backend readiness for remaining V2 screens** (per [V2_FRONTEND_BACKEND_MAPPING.md](V2_FRONTEND_BACKEND_MAPPING.md)): Virtual Office and Journey/Startup Profile are fully backed and can be wired with no new endpoints. Cohort View and Mentor Marketplace need 1-2 new endpoints each. Blueprint Library and AI Staff Chat need net-new backend (models + endpoints).

---

## Session Log
*(newest entry first — append, don't rewrite history)*

### 2026-09-09 — Founder Journey stage tracker built (phase 2, partial)
- Continued the mockup-fidelity plan into phase 2 (Dashboard-specific gaps). Before building, checked each of the 4 identified gaps against [V2_FRONTEND_BACKEND_MAPPING.md](V2_FRONTEND_BACKEND_MAPPING.md) and found 3 of 4 are blocked by missing backend (Cohort Rank tile and Cohort Leaderboard need a ranking/leaderboard endpoint that doesn't exist; the AI Staff roster card needs an `AIStaffRole` model that doesn't exist — and its mockup content is itself just illustrative placeholder text, not a real feature). Flagged this to the user rather than fabricating data for any of them. User chose "full fidelity" for the one buildable item and confirmed backend for the other three comes later ("we can add the backend when we get there") — so those three are **deferred, not built with placeholder data**.
- Built the **Founder Journey stage tracker** (`FounderJourneyTracker` in `V2FounderDashboard.jsx`): 6-circle stage progression (done/active/locked + connecting lines) using `JOURNEY_STAGES` + `useJourneyStore`'s `progress.currentStage`/`completedStages`, a real completion-percentage bar (`progress.stageData[stageId].completionPercentage`), and a genuine 3-way criteria breakdown (complete / in-progress / remaining) — no fabricated numbers.
- The 3-way breakdown needed per-criterion completion data that only existed as a **private, unexported `STAGE_TASKS` constant inside `FounderDashboard.jsx`** (V1). Extracted it verbatim to a new shared file, `client/src/domains/founder/stageTasks.js`, and updated `FounderDashboard.jsx` to import it instead of defining it locally — zero behavior change for V1 (confirmed only one call site, `STAGE_TASKS[currentStageId]`, still resolves identically).
- "In progress" vs "remaining" is computed from `useStageTaskStore`'s real saved responses: a task counts as in-progress if it has saved text but no `completedAt`, remaining if it has neither.
- Build verified clean, both `/v2` and `/v2/execution` re-confirmed working in browser (execution engine untouched by this change, re-checked since it shares `V2Chip`/`useJourneyStore` wiring). Note for future sessions: the Browser-pane's default ~800px width visually wraps/clips topbar chips that fit fine at a real desktop width (1440px) — resize before concluding something is visually broken.
- **Not yet done:** commit this work. Cohort Rank/Leaderboard/AI-Staff-roster remain open, deferred pending backend. Phase 3 (Execution Engine gaps) not started.

### 2026-09-09 — Top bar built to match mockups (in progress: 1 of 3 phases)
- User noticed the rendered dashboard's top bar didn't match the reference design. Read `StartupVerse_Dashboard_v2(1).html` and `StartupVerse_Execution_Engine.html` in full and diffed them against the built `V2FounderDashboard.jsx`/`V2ExecutionEngine.jsx` — found real structural gaps beyond just the top bar (see "Mockup fidelity gap found" entry below). Agreed plan with user: **top bar first** (shared, highest visual impact), then Dashboard-specific gaps (stage tracker, cohort rank tile, leaderboard, AI staff roster), then Execution-Engine-specific gaps (week tabs, 7-step loop visual, blocker callout, right-panel AI suggestion + task load).
- **Top bar — done:** `V2Topbar` in `V2AppLayout.jsx` already existed but was unused/underused. Extended its API: `breadcrumb` (default "StartupVerse"), `title`, `chips` (array, rendered left), `actions` (rendered right) — replacing the old plain `title`/`subtitle` pair. Wired real data into both screens:
  - Dashboard: `Founder Dashboard · [{startup} · Stage {n}]` left; `[Week {n} · {today's day name}]`, **Open Virtual Office**, **Set weekly goal** right.
  - Execution Engine: `Execution Engine · [{startup} · Stage {n}] [Week {n} active · {streak}-week streak]` left; `[Sunday deadline · {n} days left]`, **History** (static for now — mockup itself doesn't wire it to anything either), **New week goal** right.
  - "New week goal" needed to open `WeeklyGoalCard`'s edit mode, but that state was local to the card. Added a minimal `editTrigger` counter prop (parent increments it, card's `useEffect` opens edit mode on change) rather than fully lifting the state — smallest change that doesn't touch the card's existing internals.
  - Found and fixed a real bug during this: `V2Chip` had no `whitespace-nowrap`, so chip text wrapped mid-pill at normal viewport widths. Fixed at the primitive level (`v2-primitives.jsx`) since it's a general chip correctness issue, not top-bar-specific.
  - Hit a stale-Vite-HMR-module error (`topbarSubtitle is not defined`, referencing a prop that no longer existed anywhere in source) after removing the old `subtitle` prop — a plain hard-reload didn't clear it, closing and reopening the browser tab did. Worth remembering if a "phantom" reference error shows up after a prop rename.
- Build verified clean (`npm run build`, 0 errors) and both screens visually re-confirmed in browser at a realistic 1440px width (the Browser-pane's default 800px width was itself causing the wrap symptom initially, before the real `whitespace-nowrap` bug was found underneath it).
- **Not yet done, not yet committed:** Dashboard-specific and Execution-Engine-specific gaps from the plan above are still open. Commit the top-bar work as its own piece before starting the next phase.

### 2026-09-09 — Mockup fidelity gap found: V2 build diverged from the actual reference designs
- User asked directly whether the built V2 UI actually matches "our new UI interface" — prompted by the top bar not matching. Answer was honestly no: this session hadn't checked, and neither had the original V2 build (051ab26/d616061/640f1c5), which built its own interpretation from a generic "V2 design system" rather than translating the actual HTML mockups in `Startupverse/Startupverse latest version/`.
- Read `StartupVerse_Dashboard_v2(1).html` and `StartupVerse_Execution_Engine.html` fully and diffed against `V2FounderDashboard.jsx`/`V2ExecutionEngine.jsx`. Confirmed gaps beyond the top bar:
  - **Dashboard:** hero card structure differs (mockup fuses greeting + cohort/rank narrative + embedded goal box + big score ring into one card; build spreads these across separate cards and drops the cohort-rank narrative entirely). 4th stat tile should be **Cohort Rank** (build has "This Week %" instead — cohort rank doesn't exist anywhere in the build). Missing entirely: the 6-step **Founder Journey stage tracker** with per-stage completion %, the **streak calendar** (12-week grid), the **2-column task board** (In Progress vs Done, with assignee avatars), the **live activity feed**, the **Cohort Leaderboard** card, and the **named AI Staff roster** card (AI PM/Marketing/Growth with live status). Build substitutes a generic "Quick Actions" button list for the last one.
  - **Execution Engine:** missing the **week tabs** row (Week 1...7 pills), the **7-step visual execution loop** (Set goal → Milestones → Assign → Execute → Track → Log outcome → New cycle, with connectors and done/active/upcoming states), the milestone task rows' **blocker callout box** (named blocker + reason + Resolve button), and in the right panel: **streak-dot strip**, **3 mini-stat boxes**, **AI Product Manager suggestion callout**, and **per-member task-load bars**.
- This is a real, large scope — not a quick fix. Agreed with user to work through it in phases starting with the top bar (see entry above). **Every future V2 screen should be read from its mockup file first**, not designed fresh from the generic V2 primitives — see the warning added to Current State.

### 2026-09-09 — Root cause found + fixed: `/v2` was rendering V1, not V2
- **Symptom:** after fixing local auth and completing onboarding, visiting `/v2` in a real browser still rendered the old V1 "Founder Dashboard," never the new V2 UI.
- **Root cause:** `DASHBOARD_ROUTE_PATHS` in `client/src/app/dashboardPaths.js` (an array `App.jsx` loops over to generate `<Route>` elements pointing at the V1 `dashboardHybridElement`) had all 8 `/v2/*` paths mistakenly added to it in the very first V2 commit (051ab26/d616061 era), with a comment claiming it was "so path guards hit them quickly." It isn't a guard list — it's the V1 route table. This created two sibling `<Route path="/v2">` elements (one → V1, one → the real V2 shell); React Router resolves same-specificity ties by declaration order, and the V1 one was listed first, so it always won. The dedicated `/v2` + `/v2/*` routes to `v2ShellElement` (added correctly in 640f1c5) were dead code the whole time.
- **Fix:** removed the 8 V2 lines + misleading comment from `DASHBOARD_ROUTE_PATHS`. Guard coverage for the `v2` path prefix already exists separately via `DASHBOARD_PATH_PREFIXES` (unaffected, still correct) — no other change needed.
- **Verified:** hot-reloaded via Vite, then `/v2` and `/v2/execution` both confirmed rendering the correct V2 UI (score ring, 3-column layout, milestones, tasks) via screenshot in the local dev environment, using a throwaway test account.
- **Not yet done:** this fix is uncommitted. Commit it before moving on to the next screen.

### 2026-09-09 — Local dev environment stood up (MongoDB + backend + frontend, all local)
- **Why:** testing V2 against the production API hit a wall — production's auth cookie is `sameSite: "strict"` ([sendToken.js:18](server/src/utils/sendToken.js)), which cannot work for a genuinely cross-site client (`localhost:3000` → `api.startupverse.space`). Signup/signin would succeed server-side but the browser would silently refuse to store the cookie, so the very next `/auth/me` check always came back 401. Loosening production's cookie policy to `SameSite=None` would fix it but affects all real users' CSRF exposure — decided against doing that reflexively; ran the backend locally instead.
- Also needed, and fixed first: production `CORS_ORIGIN` on Railway didn't include `http://localhost:3000` — appended it (additive, comma-separated, did not touch the existing production origins). This got past the CORS error but exposed the cookie issue above right behind it. **This production CORS_ORIGIN change is still live** — `http://localhost:3000` is now a permanently-allowed origin on the production API. Not reverted since it's harmless (an origin having *permission* isn't traffic), but worth knowing it's there.
- MongoDB Community 8.3.9 installed as a portable ZIP (no admin rights available in this environment — Chocolatey's installer needs elevation we didn't have) under `Startupverse/mongodb-local/`. Downloaded from `fastdl.mongodb.org` (~880MB), extracted, run directly as `mongod.exe --dbpath ... --port 27017`.
- `server/npm install` run (no `node_modules` existed yet); `server/.env` created fresh with a locally-generated JWT secret and `mongodb://127.0.0.1:27017/startupverse_dev` — see Current State for full var list.
- `client/.env.local` changed from the production API URL to `http://localhost:5000/api/v1`; had to fully restart (not just HMR) the Vite dev server for the env change to take effect.
- **Side effect to be aware of:** mid-debugging, a throwaway `debugtester1@example.com` / "Debug Tester" account was created directly via curl against the local backend for isolated repro testing, and was later also signed into the shared Browser-pane tab via a diagnostic `fetch()` call — this briefly and confusingly replaced the real user's session cookie in that tab. Resolved by having the user re-authenticate. Lesson: don't sign into a shared/visible browser tab from a script for diagnostics — use curl with a separate cookie jar instead (as was done for the rest of the debugging).
- **Verified:** `/health` responds, signup/signin/onboarding all work end-to-end locally with real MongoDB persistence, confirmed via direct DB queries (`server/src` mongoose scripts) as well as the UI.

### 2026-09-09 — Onboarding "Validation failed" — not a bug
- User hit a `422 Validation failed` on every onboarding retry. Root-caused (not guessed) by temporarily adding debug logging to `founders.controller.js`'s `createOrUpdateProfile` (logged `req.body` and the caught Mongoose error), reproducing once, then immediately reverting the logging (confirmed via `git diff` showing no net change).
- **Actual cause:** the submitted `bio` field was ~2000+ characters (a long pasted block of AI-generated text about health-monitoring startup strategies), exceeding the schema's `maxlength: 2000` in `FounderProfile.js`. Correct validation behavior, not a code defect — fixed by shortening the bio text, no code change needed.

### 2026-09-09 — CLAUDE.md + SOP adopted
- Created this file. Reviewed prior session's work (see below) and confirmed current repo state matches what was reported: `.env.local` present, three V2 commits on `v2-autonomous-os`, build passing.
- Standing Operating Procedure adopted for all future sessions on this repo (see above). Rule 2/3 file references adapted to this repo's actual structure (`App.jsx`, `V2DashboardShell.jsx`, `server/src/app.js`, `client/src/state/`).
- **Not yet done:** actually starting the dev server and visually confirming `/v2` and `/v2/execution` render against the live backend.

### 2026-09-09 — V2 Dashboard + Execution Engine wired and building
- Commit [640f1c5](https://github.com/G-IHub/startup-verse/commit/640f1c5): `V2DashboardShell.jsx` (URL-driven shell at `/v2/*`, syncs `currentPage` with React Router, lazy-loads V2 screens, stubs unbuilt ones) and `V2ExecutionEngine.jsx` (725 lines — weekly goal card with inline edit/save, milestone list with expand/collapse, task list with All/Active/Blocked/Done filters, stats row, right panel with score ring + past outcomes). Wired into `App.jsx` and `dashboardPaths.js` under the existing `RequireDashboard` auth guard.
- `vite build` verified passing, zero errors.
- Created `client/.env.local` with the production `VITE_API_URL` (found by searching the codebase for the existing API base URL pattern) so local dev can hit real data without standing up a local backend.
- **Verification status:** build-verified only; not yet opened in a browser.

### 2026-09-09 — V2FounderDashboard built
- Commit [d616061](https://github.com/G-IHub/startup-verse/commit/d616061): `V2FounderDashboard.jsx` (605 lines), 3-column layout via `V2AppLayout`. Reuses `useHomeStore`, `useExecutionScoreStore`, `useWeeklyLoopStore`, `useTeamStore`, `useJourneyStore` — no new API calls.
- Fixed several state-selector mismatches found while wiring real stores: `s.data` (didn't exist) → split into `s.milestones`/`s.tasks`/`s.viewModel`; `weeklyData?.outcomeProgress` → `viewModel?.metrics?.milestoneProgress`; `s.journey` → `s.progress` (store key is actually `progress`); `journeyState?.stageName` → derived as `Stage ${stageId}` since the progress store has no `stageName` field.
- Confirmed zero modifications to V1: `FounderDashboard.jsx`, `FounderMetricsRow.jsx`, `FounderHomeHero.jsx` untouched.

### 2026-09-09 — V2 design system foundation
- Commit [051ab26](https://github.com/G-IHub/startup-verse/commit/051ab26): `tailwind.config.js` V2 color tokens, `V2Sidebar.jsx` (72px icon-only sidebar), `V2AppLayout.jsx` (3-column grid: 72px sidebar | 1fr main | 288px right panel), `v2-primitives.jsx` (shared atoms: `V2Card`, `V2Chip`, `V2Badge`, `V2ScoreRing`, `V2Btn`, `V2Avatar`, `V2Dot`).
- `V2_FRONTEND_BACKEND_MAPPING.md` written the same day, mapping all 13 planned V2 screens to existing backend endpoints and flagging what's missing per screen (see file for full detail).
