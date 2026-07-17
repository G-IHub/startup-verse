import test from "node:test";
import assert from "node:assert/strict";

import {
  navigateToInboxChat,
  resolveInboxChatNavigation,
} from "./inboxNavigation.js";

test("founder invitation chat resolves the talent user", () => {
  assert.deepEqual(
    resolveInboxChatNavigation(
      {
        itemType: "invitation",
        founderId: "founder-1",
        talentId: { _id: "talent-1" },
      },
      false,
    ),
    {
      page: "founder-chat",
      options: { messageUserId: "talent-1" },
    },
  );
});

test("talent invitation chat resolves the founder user", () => {
  assert.deepEqual(
    resolveInboxChatNavigation(
      {
        itemType: "invitation",
        founderId: { _id: "founder-1" },
        talentId: "talent-1",
      },
      true,
    ),
    {
      page: "talent-chat",
      options: { messageUserId: "founder-1" },
    },
  );
});

test("chat navigation closes the modal before changing pages", () => {
  const events = [];

  const opened = navigateToInboxChat({
    item: {
      founderId: "founder-1",
      talentId: "talent-1",
    },
    isTalentInboxUser: false,
    onClose: () => events.push("close"),
    onNavigate: (page, options) => events.push({ page, options }),
  });

  assert.equal(opened, true);
  assert.deepEqual(events, [
    "close",
    {
      page: "founder-chat",
      options: { messageUserId: "talent-1" },
    },
  ]);
});

test("chat navigation rejects an item without a peer user", () => {
  assert.equal(
    navigateToInboxChat({
      item: { founderId: "founder-1" },
      isTalentInboxUser: false,
      onNavigate: () => {},
    }),
    false,
  );
});
