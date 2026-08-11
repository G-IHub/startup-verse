# UI Cleanup Redesign Plan

Surgical cleanup across founder, talent, team-member, and organization-admin surfaces so the app feels clean, consistent, and on-token — same direction as recent Program / Browse Talent / CohortMembershipBadge refinements. **Not a visual rebrand.** Prefer removing clutter over inventing new chrome.

**Status:** Plan only (ready for parallel implementation agents)  
**Primary callout:** Analytics tab first  
**Token source of truth:** `client/tailwind.config.js` (`surface-*`, `text-*`, `primary`, `primary-tint`, `rounded-card`, `shadow-soft`, `font-heading`, `font-body`)

---

## Principles (must follow)

1. **AppLayout page meta is the page title.** Do not duplicate H1 + description inside page bodies when `AppLayoutHybrid` `PAGE_META` already covers the route (`client/src/components/layout/AppLayoutHybrid.jsx`).
2. **One composition language.** Prefer flat panels / token cards (`rounded-card`, `border-surface-border`, `bg-surface-card`, `shadow-soft`). Avoid nested card-in-card, micro-font badge stacks, and decorative gradients that fight the shell.
3. **Skeleton while loading; empty only when loaded empty.** Never flash empty-state copy during fetch. Prefer layout-shaped skeletons over full-page spinners.
4. **Preserve recent wins.** Program nested sidebar tabs + `ProgramPanelShell`; Browse Talent dedicated route without duplicate header; `CohortMembershipBadge` flat strip; `/onboarding` → `/home` for completed users.
5. **Stay on StartupVerse tokens.** No purple-on-white AI aesthetic drift; avoid `bg-slate-*`, indigo/rose avatar rainbows, raw hex sprawl (`#0d0d0d`, `#e2e4f0`), and `from-purple-*` gradients in app chrome.
6. **Surgical cleanup > rewrite.** Delete dead UI, collapse redundant headers, align loading/empty patterns. Do not change APIs, auth, or navigation contracts unless required to remove a dead route stub.
7. **Ecosystem framing, not generic SaaS.** Copy stays outcome-oriented (execution, cohort, talent fit) — not “dashboard widgets” noise.

---

## Do not change (preserve behavior/APIs)

- Backend contracts and ownership guards (`/founders/:id/analytics`, cohort analytics, talent feed, office realtime).
- Role routing via `DashboardHybrid` + `dashboardPaths` (paths, query params, program tabs).
- Program nested nav under `VerticalSidebar` (`PROGRAM_NAV_TABS`, `normalizeProgramTab`).
- Browse Talent as dedicated `team-matching` route (not buried only under Office matching).
- `CohortMembershipBadge` flat-strip behavior (dismiss, Program CTA, skeleton).
- Settings account/leave/delete flows and `SettingsPrimitives` structure.
- Chat send/receive, invitations/interests, call coordinator behavior.
- Auth, waitlist, and marketing landing pages (out of this cleanup wave).
- Admin-only debug surfaces (`AdminDashboardRealTime`, `AdminBadge`) unless they leak into normal roles.

---

## Inventory by role

### Shared shell

- **`client/src/components/layout/AppLayoutHybrid.jsx`** — Canonical `PAGE_META` titles/descriptions for dashboard, program, office, team-matching, browse-startups, analytics, settings, chat, etc. Header is the single page title surface.
- **`client/src/components/layout/VerticalSidebar.jsx`** — Role-filtered nav; Program children; Analytics founder-only; Settings all roles. Pattern to preserve.
- **`client/src/components/DashboardHybrid.jsx`** — Lazy page router; **`PageLoadingFallback`** is a centered spinner (`animate-spin` + “Loading…”) used for nearly every Suspense boundary — global spinner tax.
- **`client/src/components/office/AdaptiveVirtualOffice.jsx`** — Still mounts `view === "matching"` → `TeamMatching` (or talent divert card) and `view === "journey"`. Matching divert is legacy clutter relative to dedicated Browse route; journey view is sidebar-orphaned.

### Founder

- **Home — `client/src/components/dashboards/FounderDashboard.jsx`** (+ `founder/FounderHomeHero.jsx`, `FounderMetricsRow.jsx`, `FounderQuickActions.jsx`): Welcome hero is content (OK); full-page blue spinner on cold load; multiple `Loader2` islands; emoji-heavy toasts (`🎉`, `🚀`); card density high.
- **Office — `client/src/components/office/VirtualStartupOfficeWorkspaceV2.jsx`** (+ hubs/panels): Functional workspace; risk of nested panels and legacy Google Meet purple gradient (`GoogleMeetCall.jsx`).
- **Program — `client/src/components/program/*`**: Already refined (`ProgramWorkspace`, `ProgramPanelShell`, panel empty states). Light pass only if drift appears.
- **Browse — `client/src/components/TeamMatching.jsx`**: Recent skeleton pattern exists (`TalentCardSkeleton`); some spinner paths remain (~line 895). Keep as reference implementation for other browse/list surfaces.
- **Analytics — `client/src/components/analytics/AnalyticsDashboard.jsx`**: User callout. Uses org `SectionCard`/`StatTile`/`EmptyStateBlock`. Issues: pulse “Loading analytics…” in a card (not skeleton); auto-refresh every 30s + “Syncing…” banner; nested `SectionCard` grid; hardcoded hex tab styles; chart `COLORS.purple`; emoji `console.log` noise; toolbar OK (no duplicate H1).
- **Chat — `client/src/components/office/FounderChatPage.jsx`**: Full-page spinner while roster loads.
- **Settings — `client/src/components/SettingsPage.jsx`**: Already on `SettingsPrimitives`; no duplicate H1. Light consistency pass only.
- **Legacy stage routes** still wired in `DashboardHybrid` (`FounderJourney`, `IdeationValidation`, `CompanyFormation`, etc.) but **absent from sidebar** — orphan chrome / gradient stage pages (`stages/*.jsx`, `DocumentsPage.jsx` purple gradients).

### Talent

- **Home — `client/src/components/dashboards/TalentDashboard.jsx`**: Duplicate page H1 (“Welcome back…”) under AppLayout “Dashboard” meta; `bg-slate` / indigo / rose avatar tones; loading text + empty-state risk on matches; large dual Home/Browse composition in one file.
- **Browse Startups — `client/src/components/founders/BrowseStartupsPage.jsx`**: Spinner loading (“Loading startups…”); should mirror TeamMatching skeleton pattern.
- **Chat — `client/src/components/talent/TalentChatPage.jsx`**: Spinner with hardcoded `#3a5afe` border.
- **Settings:** Shared `SettingsPage`.

### Team-member

- **Home — `client/src/components/dashboards/TeamMemberDashboard.jsx`**: Hardcoded hex panel system (`#0d0d0d`, `#fff7e8`, custom shadows) instead of tokens; “Welcome back” hero card under AppLayout meta; `Loader2` “Loading My Work Today”; dense Card grid (check-in / blockers / team / coming up).
- **Office / Program / Chat / Settings:** Same shared surfaces as founder (Office, Program nested tabs, FounderChatPage, Settings). Cleanup inherits from those streams once team-member home is tokenized.

### Organization-admin

- **Home — `client/src/components/dashboards/OrganizationDashboard.jsx`**: Own `h-screen` composition + `GradientHero` + cohort list; Settings action stub `onClick: () => {}`; may feel double-framed inside AppLayout.
- **Cohort shell — `client/src/components/organizations/CohortDashboardWithSidebar.jsx`** + widgets (`DeliverablesManager`, `EventManager`, `CommunicationCenter`, `MentorManager`, `PortfolioOverview`, `ProgramMilestones`, etc.).
- **Cohort analytics — `client/src/components/organizations/CohortAnalyticsDashboard.jsx`**: Parallel to founder analytics (loading/empty/`SectionCard` patterns); align after founder Analytics cleanup.
- **Primitives — `client/src/components/organizations/_primitives/*`**: Shared `SectionCard`, `StatTile`, `EmptyStateBlock`, `GradientHero` — good for org density but encourage nested boxes if overused on founder Analytics.

---

## Remove / simplify candidates

| Candidate | Path / pattern | Action |
|---|---|---|
| Global Suspense spinner | `DashboardHybrid.jsx` `PageLoadingFallback` | Replace with token skeleton shell (page-shaped, no spinner copy) |
| Analytics cold-load pulse card | `AnalyticsDashboard.jsx` loading branch | Skeleton grid matching StatTile + chart layout |
| Analytics 30s auto-refresh + sync banner | same | Manual refresh only (or silent background refresh without banner) |
| Analytics nested card overload | Overview/Velocity/Blockers/Team tabs | Flatten: fewer wrapping `SectionCard`s; prefer one panel + internal sections |
| Analytics hex/purple drift | Tabs + `COLORS.purple` | Map to `surface-border`, `text-*`, `primary`; drop purple series |
| Talent Home duplicate H1 | `TalentDashboard.jsx` | Drop page-level Welcome H1; keep compact greeting strip or first-name in content only |
| Team-member Welcome hero card | `TeamMemberDashboard.jsx` | Flatten; rely on AppLayout meta; tokenize colors |
| Founder full-page spinner | `FounderDashboard.jsx` ~1682 | Home skeleton matching hero + metrics + focus layout |
| Office `matching` divert | `AdaptiveVirtualOffice.jsx` | Redirect to `/team-matching` (or remove view); delete talent “browse from home” stub card |
| Orphan stage gradient pages | `stages/*.jsx`, `DocumentsPage.jsx` | Deprioritize; if still routable from journey only, strip purple gradients when touched — do not expand scope to rebuild stages |
| Compensation demo purple cards | `CompensationDemoPage.jsx` | Dev-only; leave unless linked from prod nav |
| Emoji toast / console noise | FounderDashboard, AnalyticsDashboard, InviteDetailModal | Neutral copy; remove emoji from user-facing strings and debug logs in touched files |
| Hardcoded chat spinner colors | `TalentChatPage.jsx`, `FounderChatPage.jsx` | Skeleton list + `border-primary` tokens |
| BrowseStartups spinner | `BrowseStartupsPage.jsx` | Port `TalentCardSkeleton`-style grid from TeamMatching |
| Org Settings noop | `OrganizationDashboard.jsx` GradientHero actions | Wire to real settings or remove the button |
| Slate/indigo avatar tones | `TalentDashboard.jsx` `getAvatarTone` | Tokenized primary-tint / surface neutrals only |
| Nested badge / micro-type stacks | Any remaining post-badge work | Follow CohortMembershipBadge flat-strip rule |

---

## Loading & empty-state rules

1. **While `loading === true` and no cached data:** show skeleton that mirrors final layout (metrics row, card grid, list rows). No spinner-only full pages for route content.
2. **Suspense (lazy route):** shared `PageLoadingFallback` must be a skeleton, not a spinner + “Loading…”.
3. **Refresh / mutation:** inline control spinner (`RefreshCw`) is OK on buttons only; do not replace the whole page or flash a sync banner.
4. **Empty states only after load settles** with zero items. Use `EmptyStateBlock` or `ProgramEmptyState` patterns — single icon, title, one sentence, optional CTA. No emoji.
5. **Errors:** distinct from empty (tone/danger + retry). Do not reuse empty copy for failures.
6. **Do not show empty flash:** if previous data exists, keep it visible during background refresh (stale-while-revalidate).
7. **Reference implementations:** `TeamMatching.jsx` talent skeletons; `CohortMembershipBadge` membership skeleton; `ProgramEmptyState` for settled empty.

---

## Parallel workstreams (6 streams)

### Stream A — Analytics-first (founder)

- **Owner surface:** Founder Analytics tab  
- **Files likely touched:**  
  - `client/src/components/analytics/AnalyticsDashboard.jsx`  
  - Optionally shared: `client/src/components/organizations/_primitives/StatTile.jsx`, `SectionCard.jsx`, `EmptyStateBlock.jsx` (only if token gaps block Analytics)  
- **Acceptance criteria:**  
  - No duplicate page H1 (AppLayout meta only).  
  - Cold load = skeleton (stat row + chart panels), not pulse card.  
  - No 30s noisy sync banner; refresh is manual or silent.  
  - Tabs/panels use tokens (`border-surface-border`, `text-text-*`, `primary`) — no purple chart series.  
  - Nested card depth reduced (max one card chrome around a section).  
  - Empty/error states only when settled; download report still works.  
  - API contract unchanged (`GET /founders/:founderId/analytics`).  
- **Dependencies / order:** None — start immediately (Wave 1 lead). Share loading rules with Stream B.

### Stream B — Shared shell & loading primitives

- **Owner surface:** AppLayout + Suspense fallback + Office divert cleanup  
- **Files likely touched:**  
  - `client/src/components/DashboardHybrid.jsx` (`PageLoadingFallback`)  
  - `client/src/components/layout/AppLayoutHybrid.jsx` (PAGE_META copy polish only if needed)  
  - `client/src/components/office/AdaptiveVirtualOffice.jsx`  
  - Optional small shared skeleton helper under `client/src/components/shell/` or `ui/` if none exists  
- **Acceptance criteria:**  
  - Every lazy route shows skeleton fallback, not spinner text.  
  - Office `matching` view redirects to dedicated Browse Talent path (founder) / does not show dead divert card (talent).  
  - PAGE_META remains single source of page titles; no new in-header widgets.  
- **Dependencies / order:** None — parallel with A. Other streams should reuse the new fallback once landed.

### Stream C — Founder Home (+ light Office chrome)

- **Owner surface:** Founder dashboard home  
- **Files likely touched:**  
  - `client/src/components/dashboards/FounderDashboard.jsx`  
  - `client/src/components/dashboards/founder/FounderHomeHero.jsx`  
  - `client/src/components/dashboards/founder/FounderMetricsRow.jsx`  
  - `client/src/components/dashboards/founder/FounderQuickActions.jsx`  
  - Touch Office only if obvious nested-box / purple drift: `GoogleMeetCall.jsx` (if still reachable)  
- **Acceptance criteria:**  
  - Cold load skeleton instead of blue full-page spinner.  
  - No emoji in toast titles/descriptions for actions touched.  
  - Panels use token classes; reduce redundant nested Card wrappers where safe.  
  - Welcome hero stays as content greeting (not a second page title block with AppLayout-scale H1/description pair).  
  - Program / TeamMatching behavior untouched.  
- **Dependencies / order:** Prefer Stream B fallback merged first; otherwise self-contained skeletons OK.

### Stream D — Talent Home, Browse Startups, Chat

- **Owner surface:** Talent role primary pages  
- **Files likely touched:**  
  - `client/src/components/dashboards/TalentDashboard.jsx`  
  - `client/src/components/founders/BrowseStartupsPage.jsx`  
  - `client/src/components/talent/TalentChatPage.jsx`  
  - Reuse patterns from `client/src/components/TeamMatching.jsx`  
- **Acceptance criteria:**  
  - Remove duplicate Welcome H1 under AppLayout.  
  - Replace slate/indigo avatar palette with token neutrals/primary-tint.  
  - Browse Startups uses card skeletons (no spinner empty flash).  
  - Chat roster load uses list skeleton.  
  - Empty states only when feed settled empty; CTAs preserve interest/invite flows.  
- **Dependencies / order:** Parallel after B starts; mirror TeamMatching skeleton API visually.

### Stream E — Team-member Home (+ shared Chat/Settings polish)

- **Owner surface:** Team-member dashboard  
- **Files likely touched:**  
  - `client/src/components/dashboards/TeamMemberDashboard.jsx`  
  - `client/src/components/office/FounderChatPage.jsx` (shared with founder chat)  
  - `client/src/components/SettingsPage.jsx` / `settings/SettingsPrimitives.jsx` (only if token gaps)  
- **Acceptance criteria:**  
  - Replace hex/`#fff7e8` panel system with `surface-*` / `text-*` / `rounded-card` / `shadow-soft`.  
  - Drop or flatten Welcome hero that duplicates AppLayout meta.  
  - Loading = skeleton of My Work layout, not “Loading My Work Today” spinner row.  
  - Card count reduced where sections can share one panel.  
  - Chat loading aligned with Stream D.  
- **Dependencies / order:** Parallel with D; coordinate Chat file ownership with D (one owner for `FounderChatPage`).

### Stream F — Organization cohort surfaces

- **Owner surface:** OrganizationDashboard + cohort widgets + cohort analytics  
- **Files likely touched:**  
  - `client/src/components/dashboards/OrganizationDashboard.jsx`  
  - `client/src/components/organizations/CohortDashboardWithSidebar.jsx`  
  - `client/src/components/organizations/CohortAnalyticsDashboard.jsx`  
  - Widget entry points as needed (`PortfolioOverview.jsx`, `OrganizationWidgetShell.jsx`, managers)  
  - Preserve `CohortMembershipBadge.jsx` as-is  
- **Acceptance criteria:**  
  - Fix or remove noop Settings CTA on GradientHero.  
  - Reduce double-frame feel inside AppLayout (avoid extra full-viewport chrome fighting shell).  
  - Cohort analytics loading/empty aligned with Stream A patterns.  
  - No regression to cohort CRUD, milestones, deliverables, events APIs.  
  - Keep org primitives; stop nesting SectionCard inside SectionCard without purpose.  
- **Dependencies / order:** Wave 2; adopt Analytics skeleton patterns from Stream A.

---

## Suggested implementation order

### Wave 1 (ship first — parallel)

| Stream | Why first |
|---|---|
| **A Analytics-first** | Explicit user priority; high visual debt; isolated file |
| **B Shared shell fallback** | Multiplies quality across all lazy routes |
| **C Founder Home loading/headers** | Highest daily founder surface; matches Analytics polish |

Optional same-wave if capacity: start **D** BrowseStartups skeleton only (small, mirrors TeamMatching).

### Wave 2 (after Wave 1 patterns land)

| Stream | Why second |
|---|---|
| **D Talent Home + Chat** | Needs agreed skeleton/empty rules from Wave 1 |
| **E Team-member Home** | Token migration of hex system; shared chat with D |
| **F Organization** | Broader widget surface; reuse Analytics patterns |

**Explicit non-goals for both waves:** auth redesign, dark-mode project, stage-journey rebuild, compensation demo polish, backend analytics schema changes, purple marketing landing (`WaitlistLandingPage.jsx`).

---

## Analytics-first notes

User called out Analytics specifically — treat Stream A as the **reference cleanup** for density + loading.

**Current pain (concrete):**

1. Cold load returns a single pulsing `SectionCard` (“Loading analytics…”) instead of a layout skeleton (`AnalyticsDashboard.jsx` ~264–272).  
2. Auto-refresh every 30s (`setInterval` ~117–123) plus full-width “Syncing live execution data…” banner (~366–373) creates constant motion noise.  
3. Overview packs multiple `SectionCard`s inside tab content on top of StatTiles — nested box clutter.  
4. Tab triggers hardcode `#e2e4f0` / `#4a4a5a` / `#3a5afe` instead of `border-surface-border` / `text-text-body` / `text-primary`.  
5. Chart palette includes `purple: "#9B59B6"` — off-brand vs primary/success/warning/danger tokens.  
6. Debug `console.log` with emoji probes should be removed while touching the file.  
7. Page title correctly deferred to AppLayout (`PAGE_META.analytics`) — **keep that**; only keep a slim actions row (Download / Refresh).

**Target shape:**

- Skeleton: 4 stat placeholders + tab bar + 2–3 chart/list placeholders.  
- Loaded: StatTile row → token tab list → flatter sections (header + body, avoid card-in-card).  
- Refresh: button spinner only; preserve last good data while refetching.  
- Empty per chart/list via compact `EmptyStateBlock` only when that series is empty post-load.  
- Same rules later applied to `CohortAnalyticsDashboard.jsx` in Stream F.

**Out of scope for Analytics stream:** new metrics, new endpoints, PDF export redesign, org cohort analytics feature parity (Wave 2 alignment only).

---

## Parallel spawn cheat-sheet (for parent agent)

Wave 1 agents can start immediately on:

1. **Stream A** — `AnalyticsDashboard.jsx` cleanup (skeleton, tokens, flatten cards, kill noisy auto-refresh UI).  
2. **Stream B** — `PageLoadingFallback` skeleton + Office matching divert removal/redirect.  
3. **Stream C** — Founder Home spinner → skeleton + toast/emoji cleanup.

Hand each agent this doc path: `docs/scope/ui-cleanup-redesign.md` and their stream letter’s acceptance criteria.
