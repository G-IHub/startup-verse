import test from "node:test";
import assert from "node:assert/strict";

import {
  applySyntheticNotificationState,
  buildSyntheticPendingNotifications,
} from "./pendingOnboardingNotifications.js";

const pendingInterest = {
  id: "interest-interest-1",
  talentId: "talent-1",
  talentName: "Taylor",
  interestId: "interest-1",
  respondedAt: "2026-07-15T08:00:00.000Z",
};

test("an original interest alert does not suppress the onboarding reminder", () => {
  const serverNotifications = [
    {
      id: "notification-1",
      type: "interest-received",
      metadata: { interestId: "interest-1" },
    },
  ];

  const result = buildSyntheticPendingNotifications(
    [pendingInterest],
    serverNotifications,
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "pending-interest-interest-1");
});

test("a real pending onboarding alert prevents a duplicate reminder", () => {
  const serverNotifications = [
    {
      id: "notification-2",
      type: "interest-accepted",
      metadata: { interestId: "interest-1" },
    },
  ];

  const result = buildSyntheticPendingNotifications(
    [pendingInterest],
    serverNotifications,
  );

  assert.equal(result.length, 0);
});

test("read state remains applied when synthetic reminders are rebuilt", () => {
  const generated = buildSyntheticPendingNotifications([pendingInterest], []);
  const result = applySyntheticNotificationState(generated, {
    readIds: new Set(["pending-interest-interest-1"]),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].read, true);
});

test("dismissed synthetic reminders stay hidden when rebuilt", () => {
  const generated = buildSyntheticPendingNotifications([pendingInterest], []);
  const result = applySyntheticNotificationState(generated, {
    dismissedIds: new Set(["pending-interest-interest-1"]),
  });

  assert.equal(result.length, 0);
});
