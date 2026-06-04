# Future Dark Mode

StartupVerse currently ships **light mode only**. Dark mode was removed to fix inconsistent styling where `html.dark`, CSS variable overrides, per-component `dark:*` utilities, and hardcoded dark surfaces conflicted.

The main nav rail previously used `bg-primary-dark` (brand navy `#1a237e`) with white nav labels—that looked like dark mode but was separate from the theme toggle. It now uses light `bg-sidebar` tokens like the rest of the app.

## When reintroducing dark mode

### Single source of truth

1. Define all semantic colors in CSS variables on `:root` (light) and `.dark` (dark) in `client/src/styles/globals.css`.
2. Use Tailwind v4 class strategy on `<html class="dark">` with `@custom-variant dark (&:is(.dark *));`.
3. Prefer semantic utilities (`bg-background`, `text-foreground`, `bg-card`, `border-border`) in components—not ad-hoc `dark:bg-*` pairs.

### Infrastructure

- Restore `ThemeProvider` with preference key `startupverse_theme` in user `clientPreferences` (API already supports arbitrary keys).
- Add a theme toggle only after a full token audit passes visual QA.
- Sync Sonner and Recharts to the active theme via context or a single DOM observer—avoid duplicate theme state.

### Component checklist

- [ ] Audit all modals/dialogs in `globals.css` for hardcoded light-only styles; tokenize before shipping dark mode.
- [ ] Replace status/alert colors with shared utility classes or tokens instead of `bg-green-50 dark:bg-green-950/20` pairs.
- [ ] Tooltips and popovers: use `bg-popover` / `text-popover-foreground` only.
- [ ] Video/office surfaces: decide whether video chrome stays dark (cinema) or follows app theme; document the exception.
- [ ] Run visual QA across founder, talent, admin, mentor, organization, and marketing routes.

### Codemod reference

A one-off strip script lives at `client/scripts/strip-dark-mode.mjs`. Do not run it on a branch that should keep dark mode—it removes all `dark:*` Tailwind classes.

### Do not confuse with brand tokens

These are **palette names**, not theme mode:

- `--primary-dark`, `--accent-dark` in CSS
- `primary.dark`, `accent.dark` in `tailwind.config.js`

Keep them when adding dark mode; they are not the same as `html.dark`.
