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

## Joining rooms

After connecting, the client must emit **`room:join`** with the full room string (e.g. `startup:abc123`). Optionally **`room:leave`** on teardown. Aliases `join_room` / `leave_room` are accepted server-side for older clients.

## Server → client events

Declared in `events.js` (`SOCKET_*` constants). Payloads are domain documents or small structs as emitted from `realtime.service.js` / controllers.

| Event | Typical use |
|-------|----------------|
| `message:created` | New direct/startup message |
| `task:updated` | Task document changed |
| `activity:created` | Feed activity |
| `presence:updated` / `presence:removed` | Online state |
| `notification:created` | Unread bump for user room |

## REST pairing

Realtime complements REST; clients should still use existing message/task HTTP endpoints for initial load and degraded mode when the socket is offline.
