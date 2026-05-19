# UI redesign rollout (Phase 9.2)

Companion to [`ui-plan.md`](ui-plan.md) and [`ui-contract-matrix.md`](ui-contract-matrix.md).

## Scope boundary

- **In scope:** founder, team-member, talent, virtual office, inbox, analytics, settings, shared shell.
- **Out of scope:** auth flows, organization-admin UI, router rewrite, backend API changes.

Organization-admin surfaces stay unchanged until a future phase.

## Master + per-area flags

All flags default **off**. Per-area flags only apply when the master gate is on.

| Env variable | `uiRedesign` key | Rollout order |
|--------------|------------------|---------------|
| `VITE_UI_REDESIGN` | `enabled` | Master gate |
| `VITE_UI_REDESIGN_SHELL` | `shell` | 1 |
| `VITE_UI_REDESIGN_FOUNDER_HOME` | `founderHome` | 2 |
| `VITE_UI_REDESIGN_VIRTUAL_OFFICE` | `virtualOffice` | 3 |
| `VITE_UI_REDESIGN_TEAM_MEMBER` | `teamMember` | 4 |
| `VITE_UI_REDESIGN_TALENT` | `talent` | 5 |
| `VITE_UI_REDESIGN_INBOX` | `inbox` | 6 |
| `VITE_UI_REDESIGN_ANALYTICS_SETTINGS` | `analyticsSettings` | 7 |

Client code: [`client/src/config/featureFlags.js`](../client/src/config/featureFlags.js)

```javascript
import { isUiRedesignEnabled, uiRedesign } from "../config/featureFlags.js";

if (isUiRedesignEnabled("founderHome")) {
  // render redesigned founder home
}
```

Truthy values: `1`, `true`, `on`, `yes` (case-insensitive). Falsy: `0`, `false`, `off`, `no`.

## Local setup

Copy [`client/.env.example`](../client/.env.example) to `client/.env.local`. Example (all off):

```env
VITE_UI_REDESIGN=false
VITE_UI_REDESIGN_FOUNDER_HOME=false
```

To test founder home redesign in a future slice:

```env
VITE_UI_REDESIGN=true
VITE_UI_REDESIGN_FOUNDER_HOME=true
```

## Shared primitives

- Shell: [`client/src/components/shell/`](../client/src/components/shell/) — `PageHeader`, `PageViewport`, page templates
- View models: [`client/src/domains/`](../client/src/domains/) — barrel [`index.js`](../client/src/domains/index.js)

## Verification

```bash
cd client && npm run build
cd server && npm run test:alignment-gate
```

Manual: log in as founder and talent; confirm header/sidebar unchanged with all flags off. Org-admin cohort UI unchanged.

## Legacy UI removal

Do **not** delete legacy components or routes until the redesigned area passes manual acceptance ([`ui-plan.md`](ui-plan.md) §8.2) and you explicitly approve removal.

## Coding checklist

Track sub-steps in [`CODING_TODO_STEPS.md`](CODING_TODO_STEPS.md) Phase 9.2a–h.
