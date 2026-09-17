# StartupVerse V2 — Frontend ↔ Backend Mapping
**Branch:** `v2-autonomous-os`  
**Last updated:** 2026-09-09  
**Purpose:** Map every V2 design screen to existing backend APIs. Identify what's ready, what needs new endpoints, and what's net-new for the Autonomous OS layer.

---

## Legend
- ✅ **Ready** — API exists, works, wire it up
- ⚠️ **Partial** — API exists but needs extension
- ❌ **Missing** — No backend, must build

---

## Screen 1 — Dashboard

**V2 Design:** Execution Score gauge, weekly goal status, team activity feed, quick actions, score breakdown

| Data Needed | Endpoint | Status |
|---|---|---|
| Execution Score | `GET /api/v1/execution-score/:userId` | ✅ Ready |
| Full execution data | `GET /api/v1/founders/:founderId/execution-data` | ✅ Ready |
| Startup snapshot | `GET /api/v1/startups/:founderId/snapshot` | ✅ Ready |
| Weekly outcomes | `GET /api/v1/founders/:founderId/weekly-outcomes` | ✅ Ready |
| Tasks | `GET /api/v1/founders/:founderId/tasks` | ✅ Ready |
| Team activity feed | `GET /api/v1/activity` (activityRouter) | ✅ Ready |
| Announcements | `GET /api/v1/founder/:founderId/announcements` | ✅ Ready |
| Analytics | `GET /api/v1/founders/:founderId/analytics` | ✅ Ready |

**Verdict:** ✅ Fully backed. Dashboard can be built immediately.

---

## Screen 2 — Execution Engine

**V2 Design:** Weekly goal input, milestone tracker, task board, execution score breakdown, submit outcomes

| Data Needed | Endpoint | Status |
|---|---|---|
| Create/update weekly plan | `POST /api/v1/founders/:founderId/weekly-plan` | ✅ Ready |
| Get milestones | `GET /api/v1/founders/:founderId/milestones` | ✅ Ready |
| Create milestone | `POST /api/v1/founders/:founderId/milestones` | ✅ Ready |
| Update milestone | `PUT /api/v1/founders/:founderId/milestones/:milestoneId` | ✅ Ready |
| Delete milestone | `DELETE /api/v1/founders/:founderId/milestones/:milestoneId` | ✅ Ready |
| Get tasks | `GET /api/v1/founders/:founderId/tasks` | ✅ Ready |
| Create task | `POST /api/v1/founders/:founderId/tasks` | ✅ Ready |
| Update task status | `PATCH /api/v1/founders/:founderId/tasks/:taskId/status` | ✅ Ready |
| Assign task | `PATCH /api/v1/founders/:founderId/tasks/:taskId/assign` | ✅ Ready |
| Task comments | `GET/POST /api/v1/founders/:founderId/tasks/:taskId/comments` | ✅ Ready |
| Submit weekly outcome | `POST /api/v1/founders/:founderId/weekly-outcomes` | ✅ Ready |
| Execution score | `GET /api/v1/execution-score/:userId` | ✅ Ready |
| Parse founder intent | `POST /api/v1/founders/:founderId/intent-parse` | ✅ Ready (AI hook!) |

**Verdict:** ✅ Most complete screen in the backend. Wire directly.  
**Note:** `intent-parse` endpoint is an AI hook — this is where AI Staff PM plugs in later.

---

## Screen 3 — Virtual Office

**V2 Design:** Team presence, activity feed, Wall of Wins, announcements, task board, daily check-in, calendar

| Data Needed | Endpoint | Status |
|---|---|---|
| Real-time presence | `presenceRouter` + Socket.IO | ✅ Ready |
| Activity feed | `activityRouter` | ✅ Ready |
| Announcements | `announcementsRouter` | ✅ Ready |
| Messages | `messagesRouter` | ✅ Ready |
| Polls | `pollsRouter` | ✅ Ready |
| Events/calendar | `eventsRouter` + `GET /api/v1/founder/:founderId/events` | ✅ Ready |
| Team members | `GET /api/v1/founders/:founderId/team-members` | ✅ Ready |
| Video/voice calls | `callsRouter` (LiveKit) | ✅ Ready (added Jun 2026) |
| Work logs | `GET /api/v1/founders/:founderId/work-logs` | ✅ Ready |

**Verdict:** ✅ Fully backed including real-time and video calling.

---

## Screen 4 — Startup Profile / Journey Stages

**V2 Design:** 6-stage startup journey, stage completion tracking, startup info, founder profile, learning resources

| Data Needed | Endpoint | Status |
|---|---|---|
| Founder profile | `GET /api/v1/founders/profile/:userId` | ✅ Ready |
| Startup info | `GET /api/v1/founders/:founderId/startup` | ✅ Ready |
| Journey state | `GET /api/v1/founders/:founderId/journey` | ✅ Ready |
| Update journey | `PUT /api/v1/founders/:founderId/journey` | ✅ Ready |
| Stage completions | `GET/POST /api/v1/founders/:founderId/stage-completions` | ✅ Ready |
| Stage tasks | `GET/PUT /api/v1/founders/:founderId/stage-tasks` | ✅ Ready |
| Execution state | `GET /api/v1/founders/:founderId/execution-state` | ✅ Ready |
| Learning resources | `GET /api/v1/founders/:founderId/learning-resources` | ✅ Ready |
| Learning progress | `GET/POST /api/v1/founders/:founderId/learning-progress` | ✅ Ready |

**Verdict:** ✅ Fully backed. One of the most complete features.

---

## Screen 5 — Cohort View / Community

**V2 Design:** Cohort leaderboard, accountability feed, challenges, group sessions, week progress

| Data Needed | Endpoint | Status |
|---|---|---|
| Cohort info | `GET /api/v1/cohorts/founder/:founderId` | ✅ Ready |
| Cohort by org | `GET /api/v1/cohorts/organization/:orgId` | ✅ Ready |
| Program milestones | `GET /api/v1/cohorts/:cohortId/program-milestones` | ✅ Ready |
| Deliverables | `deliverablesRouter` | ✅ Ready |
| Cohort members | `membershipsRouter` | ✅ Ready |
| Leaderboard | ❌ No leaderboard endpoint | ❌ Missing |
| Accountability feed | ⚠️ activity feed is close but not cohort-scoped | ⚠️ Partial |
| Challenges | ❌ No challenges model | ❌ Missing |

**Verdict:** ⚠️ Core cohort data is there. Need 2 new endpoints:
- `GET /api/v1/cohorts/:cohortId/leaderboard` — ranked execution scores
- `GET /api/v1/cohorts/:cohortId/feed` — cohort-scoped activity feed

---

## Screen 6 — Onboarding Flow

**V2 Design:** 5-step wizard, startup name, domain, blueprint picker, team setup

| Data Needed | Endpoint | Status |
|---|---|---|
| Create profile | `POST /api/v1/founders/profile` | ✅ Ready |
| Create startup | `POST /api/v1/founders/startup` | ✅ Ready |
| Organization onboarding | `POST /api/v1/organizations/onboarding` | ✅ Ready |
| Blueprint selection | ❌ No blueprint model | ❌ Missing |

**Verdict:** ⚠️ Steps 1-2 and team setup are backed. Blueprint picker step needs new backend.

---

## Screen 7 — Mentor Marketplace

**V2 Design:** Mentor cards, filter by expertise, match score, booking, assigned mentors

| Data Needed | Endpoint | Status |
|---|---|---|
| List org mentors | `GET /api/v1/organizations/:orgId/mentors` | ✅ Ready |
| Get founder's mentors | `GET /api/v1/founders/:founderId/mentors` | ✅ Ready |
| Get mentor by ID | `GET /api/v1/mentors/:mentorId` | ✅ Ready |
| Assign mentor | `POST /api/v1/mentors/:mentorId/assign-founder` | ✅ Ready |
| Public marketplace browse | ❌ No public mentor listing endpoint | ❌ Missing |
| Mentor availability/booking | ❌ No booking system | ❌ Missing |
| Match score | ❌ No matching algorithm | ❌ Missing |

**Verdict:** ⚠️ Org-scoped mentor management exists. Marketplace-style browsing + booking is missing.  
**New endpoints needed:**
- `GET /api/v1/mentors` — public listing with filters
- `POST /api/v1/mentors/:mentorId/book` — booking request

---

## Screen 8 — Mentor Profile

**V2 Design:** Mentor bio, expertise, pricing, availability calendar, founder reviews, book session

| Data Needed | Endpoint | Status |
|---|---|---|
| Mentor profile | `GET /api/v1/mentors/:mentorId` | ✅ Ready |
| Assigned founders | `GET /api/v1/mentors/:mentorId/assigned-founders` | ✅ Ready |
| Availability | ❌ No availability model | ❌ Missing |
| Reviews/ratings | ❌ No review model | ❌ Missing |
| Book session | ❌ No booking endpoint | ❌ Missing |

**Verdict:** ❌ Mostly missing. Mentor profile data exists but availability + booking + reviews need building.

---

## Screen 9 — Blueprint Library

**V2 Design:** Blueprint cards, categories, install button, fit analysis, creator info

| Data Needed | Endpoint | Status |
|---|---|---|
| List blueprints | ❌ No Blueprint model | ❌ Missing |
| Blueprint detail | ❌ No Blueprint model | ❌ Missing |
| Install blueprint | ❌ No install endpoint | ❌ Missing |
| Fit analysis | ❌ No matching logic | ❌ Missing |

**Verdict:** ❌ Entirely new feature. Needs:
- `Blueprint` MongoDB model
- `GET /api/v1/blueprints` — list with filters
- `GET /api/v1/blueprints/:blueprintId` — detail + stages
- `POST /api/v1/founders/:founderId/blueprints/install` — install + scaffold execution plan

---

## Screen 10 — Blueprint Detail

**V2 Design:** Stage-by-stage roadmap, milestones, KPIs, tactics, founder reviews, install CTA

| Data Needed | Endpoint | Status |
|---|---|---|
| Blueprint stages | ❌ Blueprint model needed | ❌ Missing |
| Founder reviews | ❌ Review model needed | ❌ Missing |
| Install/scaffold | ❌ Install endpoint needed | ❌ Missing |

**Verdict:** ❌ Same as Blueprint Library — fully new.

---

## Screen 11 — AI Staff

**V2 Design:** Hired staff cards (AI PM, Marketing, Growth), marketplace of available roles, usage/score projection

| Data Needed | Endpoint | Status |
|---|---|---|
| List hired AI staff | ❌ No AIStaff model | ❌ Missing |
| Hire AI staff role | ❌ No endpoint | ❌ Missing |
| AI staff marketplace | ❌ No endpoint | ❌ Missing |
| Score projection | ❌ No endpoint | ❌ Missing |

**Verdict:** ❌ Entirely new. Needs:
- `AIStaffRole` model
- `GET /api/v1/founders/:founderId/ai-staff` — hired staff
- `POST /api/v1/founders/:founderId/ai-staff/hire` — hire a role
- `GET /api/v1/ai-staff/marketplace` — available roles

---

## Screen 12 — AI Staff Chat

**V2 Design:** Context-aware chat with AI PM/Marketing/Growth, structured outputs (sprint cards, templates), send/receive

| Data Needed | Endpoint | Status |
|---|---|---|
| Send message to AI Staff | ❌ No AI chat endpoint | ❌ Missing |
| Startup context injection | `GET /api/v1/founders/:founderId/execution-data` | ✅ Ready (feed into prompt) |
| Sprint plan generation | ❌ No endpoint | ❌ Missing |
| Outreach template generation | ❌ No endpoint | ❌ Missing |
| Chat history | ❌ No AI conversation model | ❌ Missing |
| Intent parse (existing) | `POST /api/v1/founders/:founderId/intent-parse` | ⚠️ Extend this |

**Verdict:** ❌ New endpoints needed. BUT the context data is all there — execution-data + snapshot feed directly into the AI prompt.  
**Key insight:** `intent-parse` endpoint is the seed of the AI Staff chat. Extend it.

---

## Screen 13 — Investor View

**V2 Design:** Startup portfolio, execution scores, live metrics, investment thesis match

| Data Needed | Endpoint | Status |
|---|---|---|
| Public startup listing | ❌ No public endpoint | ❌ Missing |
| Execution score (public) | ❌ Score is private currently | ❌ Missing |
| Investment metrics | ❌ No investor model | ❌ Missing |

**Verdict:** ❌ Future feature. Don't build yet.

---

## GitHub Integration (AI Developer Agent Foundation)

Already built Aug 17, 2026 — this is the entry point for the AI Developer agent:

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/github/oauth/authorize` | Connect founder's GitHub |
| `GET /api/v1/github/oauth/callback` | OAuth callback |
| `GET /api/v1/github/repos` | List founder's repos |
| `GET /api/v1/github/repos/:owner/:repo/issues` | List issues |
| `POST /api/v1/github/import` | Import GitHub issues as tasks |

**This is the AI Developer agent foundation.** Next step: add `POST /api/v1/github/repos/create` and `POST /api/v1/github/repos/:repo/commit` for AI-generated code deployment.

---

## Summary — What's Ready vs What to Build

### ✅ Ready to Wire (Build V2 UI now)
- Dashboard
- Execution Engine
- Virtual Office
- Startup Profile / Journey
- Partial Onboarding

### ⚠️ Needs 1-2 New Endpoints
- Cohort View (leaderboard + cohort feed)
- Mentor Marketplace (public listing + booking)
- Mentor Profile (availability + reviews)

### ❌ Net-New Backend Required
| Feature | Effort |
|---|---|
| Blueprint Library + Detail | Medium — new model + 3 endpoints |
| AI Staff + Chat | Large — new model + LLM integration |
| Investor View | Low (defer) |

---

## Build Order (Recommended)

### Phase 1 — V2 UI (Weeks 1-3)
Wire existing backend to V2 frontend design. No new backend needed.
1. Install design tokens → Tailwind config
2. Build AppLayout shell (3-column grid)
3. Screen by screen: Dashboard → Execution Engine → Virtual Office → Startup Profile → Cohort View → Onboarding

### Phase 2 — New Endpoints (Weeks 3-4)
Small backend additions that unlock remaining screens:
1. Cohort leaderboard endpoint
2. Mentor marketplace public listing
3. Mentor booking system

### Phase 3 — Blueprint Engine (Weeks 4-6)
1. Blueprint MongoDB model + seed data
2. Blueprint CRUD endpoints
3. Install endpoint that scaffolds execution plan from blueprint stages

### Phase 4 — AI Staff (Weeks 6-10)
1. Extend `intent-parse` into full AI Staff chat endpoint
2. Context injection from `execution-data` + `snapshot`
3. AIStaff model for hired roles
4. DeepSeek primary → Anthropic fallback (Zikorail-Core pattern)
5. Structured outputs: sprint cards, outreach templates

### Phase 5 — Autonomous OS (Ongoing)
1. AI Developer agent via GitHub API + Claude code generation
2. Zikorail integration for AI Marketing + Sales execution
3. Human-in-the-loop approval gates
4. Revenue dashboard for founders

---

*This document lives in the `v2-autonomous-os` branch and should be updated as endpoints are built.*
