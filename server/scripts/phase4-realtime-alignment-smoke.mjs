import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "..");

async function readClient(rel) {
  return fs.readFile(path.join(root, "client", "src", rel), "utf8");
}

async function readServer(rel) {
  return fs.readFile(path.join(root, "server", "src", rel), "utf8");
}

function assertContains(content, needle, label, failures) {
  if (!content.includes(needle)) failures.push(`Missing ${label}: ${needle}`);
}

async function main() {
  const failures = [];

  const events = await readServer("realtime/events.js");
  const socketIo = await readClient("utils/socketIoRealtime.js");
  const socketServer = await readServer("realtime/socketServer.js");
  const realtimeService = await readServer("services/realtime.service.js");
  const notificationsRoutes = await readServer("routes/notifications.routes.js");

  assertContains(events, "SOCKET_EVENTS", "server SOCKET_EVENTS export", failures);
  assertContains(socketIo, "socket.io-client", "client uses socket.io-client", failures);
  assertContains(socketIo, "room:join", "client room join contract", failures);
  assertContains(socketServer, '"room:join"', "server room:join handler", failures);
  assertContains(socketIo, "task:updated", "task realtime event name", failures);
  assertContains(socketIo, "TASK_POLL_MS", "task polling fallback interval", failures);
  assertContains(socketIo, "announcement:created", "announcement realtime event name", failures);
  assertContains(
    socketIo,
    "ANNOUNCEMENT_POLL_MS",
    "announcement polling fallback interval",
    failures,
  );
  assertContains(socketIo, "message:created", "message realtime event name", failures);
  assertContains(socketIo, "activity:created", "activity realtime event name", failures);
  assertContains(socketIo, "presence:updated", "presence realtime event name", failures);
  assertContains(socketIo, "MESSAGE_POLL_MS", "messages REST polling fallback", failures);
  assertContains(socketIo, "getConversation", "messages fallback uses REST conversation", failures);
  assertContains(realtimeService, "emitRealtime", "realtime service exposes emit helper", failures);
  assertContains(
    notificationsRoutes,
    "emitRealtime(SOCKET_EVENTS",
    "notifications route emits via SOCKET_EVENTS contract",
    failures,
  );

  if (failures.length) {
    console.error("Phase 4 realtime alignment smoke FAILED");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }
  console.log("Phase 4 realtime alignment smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 4 realtime alignment smoke crashed:", e);
  process.exit(1);
});
