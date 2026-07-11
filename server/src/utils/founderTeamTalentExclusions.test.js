import assert from "node:assert/strict";
import {
  resolveTalentProfileUserId,
  filterTalentProfilesForFounderBrowse,
} from "./founderTeamTalentExclusions.js";

function testResolveTalentProfileUserId() {
  assert.equal(resolveTalentProfileUserId({ userId: "abc123" }), "abc123");
  assert.equal(
    resolveTalentProfileUserId({ userId: { _id: "obj123" } }),
    "obj123",
  );
  assert.equal(resolveTalentProfileUserId({}), "");
}

async function testFilterTalentProfilesForFounderBrowse() {
  const profiles = [
    { userId: "talent-1" },
    { userId: { _id: "talent-2" } },
    { userId: "talent-3" },
  ];

  const filtered = await filterTalentProfilesForFounderBrowse(profiles, "");
  assert.equal(filtered.length, 3);

  const invalidFounder = await filterTalentProfilesForFounderBrowse(
    profiles,
    "not-an-object-id",
  );
  assert.equal(invalidFounder.length, 3);
}

async function run() {
  testResolveTalentProfileUserId();
  await testFilterTalentProfilesForFounderBrowse();
  console.log("founderTeamTalentExclusions: ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
