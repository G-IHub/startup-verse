/**
 * Lightweight deep-link parser tests (run: node client/src/app/deepLinks.test.mjs)
 */
import {
  buildChatPath,
  buildOfficePath,
  parseDeepLink,
} from "./deepLinks.js";
import {
  pathToDashboardState,
  dashboardStateToPath,
} from "./dashboardPaths.js";

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
  console.log("OK:", message);
}

assert(buildChatPath("user123") === "/chat?with=user123", "buildChatPath");
assert(
  buildOfficePath({ tab: "tasks", taskId: "task1" }) ===
    "/office?tab=tasks&taskId=task1",
  "buildOfficePath",
);

const chatIntent = parseDeepLink("/chat?with=abc", {}, "founder");
assert(chatIntent?.page === "founder-chat", "parse chat page");
assert(chatIntent?.options?.messageUserId === "abc", "parse chat with");

const legacyIntent = parseDeepLink(
  "/?view=virtual-office&tab=tasks&taskId=xyz",
  {},
  "founder",
);
assert(legacyIntent?.page === "startup-office", "legacy office page");
assert(legacyIntent?.options?.taskId === "xyz", "legacy taskId");

const inviteIntent = parseDeepLink(
  "/?view=virtual-office&tab=invitations&invitationId=inv1",
  { founderId: "founder99" },
  "talent",
);
assert(inviteIntent?.page === "talent-chat", "invitation routes to chat for talent");
assert(
  inviteIntent?.options?.messageUserId === "founder99",
  "invitation uses metadata founderId",
);

const teamMsgIntent = parseDeepLink(
  "/team/messages/user42",
  {},
  "founder",
);
assert(teamMsgIntent?.page === "founder-chat", "team messages routes to chat");
assert(
  teamMsgIntent?.options?.messageUserId === "user42",
  "team messages extracts userId",
);

const chatPath = buildChatPath("abc");
const chatState = pathToDashboardState("/chat", "?with=abc", "founder");
assert(chatState?.messageUserId === "abc", "pathToDashboardState reads ?with=");
assert(
  dashboardStateToPath({
    currentPage: "founder-chat",
    messageUserId: "abc",
  }) === chatPath,
  "dashboardStateToPath round-trip for chat",
);

const metadataFallback = parseDeepLink(
  "/?view=virtual-office&tab=invitations",
  { founderId: "founder1" },
  "talent",
);
assert(
  metadataFallback?.options?.messageUserId === "founder1",
  "metadata fallback when actionUrl lacks entity ID",
);

console.log("\nAll deepLinks tests passed.");
