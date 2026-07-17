import test from "node:test";
import assert from "node:assert/strict";

import { resolveOnboardingSource } from "./inboxOnboarding.js";

test("onboarding requires an invitation or interest source", () => {
  assert.equal(resolveOnboardingSource({ talentId: "talent-1" }), null);
  assert.equal(
    resolveOnboardingSource({
      talentId: "talent-1",
      invitationId: "undefined",
    }),
    null,
  );
});

test("onboarding resolves one valid source", () => {
  assert.deepEqual(
    resolveOnboardingSource({ invitationId: "invitation-1" }),
    { kind: "invitation", id: "invitation-1" },
  );
  assert.deepEqual(
    resolveOnboardingSource({ interestId: "interest-1" }),
    { kind: "interest", id: "interest-1" },
  );
});
