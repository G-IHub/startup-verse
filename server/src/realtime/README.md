# Realtime (Socket.IO)

## Client URL

The browser Socket.IO client should use the **HTTP origin** of the API (no `/api/v1` path). Example: if REST is `http://localhost:5000/api/v1`, the socket connects to `http://localhost:5000`. The server attaches Socket.IO to the same HTTP server as Express.

## Rooms

Room strings are built in `rooms.js` and must match server emits:

| Helper | Room id pattern |
|--------|-----------------|
| `startupRoom(id)` | `startup:<id>` |
| `userRoom(id)` | `user:<id>` |
| `organizationRoom(id)` | `organization:<id>` |
| `announcementRoom(id)` | `announcements:<id>` (founder virtual office only) |

Org-admin dashboards join **`organization:<organizationId>`** and filter payloads by `cohortId` when scoped to one cohort.

## Joining rooms

After connecting, the client must emit **`room:join`** with the full room string (e.g. `startup:abc123`). Optionally **`room:leave`** on teardown. Aliases `join_room` / `leave_room` are accepted server-side for older clients.

## Server → client events

Declared in `events.js` (`SOCKET_EVENTS`). Payloads include `organizationId` and usually `cohortId` for org-scoped resources.

### Founder / inbox (user and startup rooms)

| Event | Typical use |
|-------|----------------|
| `message:created` | New direct/startup/org message |
| `task:updated` | Task document changed |
| `activity:created` | Feed activity |
| `presence:updated` / `presence:removed` | Online state |
| `notification:created` | Unread bump for user room |
| `interest:created` / `interest:updated` | Talent interest inbox |
| `invitation:created` / `invitation:updated` | Founder↔talent inbox (not cohort invites) |
| `announcement:created` | Founder VO (`announcements:<startupId>` room) |

### Organization dashboard (`organization:<id>` room)

| Event | When emitted |
|-------|----------------|
| `message:created` | Org bulk/individual message, founder→org message |
| `cohort:updated` / `cohort:deleted` | Cohort settings |
| `event:created` / `event:updated` / `event:deleted` / `event:cancelled` | Cohort agenda |
| `announcement:created` / `announcement:updated` / `announcement:deleted` / `announcement:read` | Cohort communication |
| `deliverable:created` / `deliverable:updated` / `deliverable:archived` / `deliverable:deleted` | Deliverables (+ submission/review via `deliverable:updated`) |
| `resource:created` / `resource:updated` / `resource:deleted` | Resource library |
| `milestone:updated` / `milestone:deleted` | Program milestones |
| `cohort-invitation:changed` | Cohort invite create / accept / decline / cancel |

Server helper: `emitToOrganization(orgId, eventName, payload)` in `emitOrg.js`.

## REST pairing

Realtime complements REST; clients should still use existing HTTP endpoints for initial load and degraded mode when the socket is offline.
