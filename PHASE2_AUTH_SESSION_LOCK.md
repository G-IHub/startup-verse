# Phase 2 Auth/Session Lock

This document defines the canonical auth/session contract for StartupVerse Phase 2.

## Canonical Client Session Contract

- Canonical session key: `sv:session:v2`
- Session shape:
  - `version: 2`
  - `user: { id, email, role, onboardingComplete, ... } | null`
  - `accessToken: string`
  - `updatedAt?: string`
  - `migratedFromLegacy?: boolean`

## Legacy Compatibility

During migration, legacy keys are still read and synchronized:

- `startupverse_user`
- `startupverse_token`

Migration behavior:

1. On bootstrap, read `sv:session:v2`.
2. If missing, read legacy keys and create `sv:session:v2`.
3. On every session write, keep legacy keys mirrored for compatibility.

## Session Ownership Rules

- `AuthContext` is the single source of truth for authenticated user state.
- `app/session.js` owns all session persistence helpers.
- API clients must retrieve token through `getAccessToken()` and not direct localStorage token lookups.

## Backend Authorization Rules

- Public signup cannot elevate privileges (`isAdmin` is server-controlled false).
- User-scoped routes require self-or-admin checks.
- Admin/cron/migration compatibility endpoints require explicit admin role.
- Org-sensitive write routes use org-admin authorization.
