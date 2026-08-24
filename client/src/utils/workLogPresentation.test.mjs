import assert from "node:assert/strict";
import test from "node:test";
import {
  formatWorkLogTime,
  getWorkLogAttachmentSummary,
} from "../components/dashboards/founder/workLogPresentation.js";

test("summarizes every extra work attachment available to the founder", () => {
  assert.deepEqual(
    getWorkLogAttachmentSummary({
      image: { url: "/uploads/work.png" },
      linkUrl: "https://example.com/work",
    }),
    ["Photo", "Link"],
  );
  assert.deepEqual(getWorkLogAttachmentSummary({}), []);
});

test("formats valid log times and handles missing timestamps", () => {
  assert.notEqual(formatWorkLogTime("2026-08-24T13:46:55.767Z"), "Time unavailable");
  assert.equal(formatWorkLogTime(undefined), "Time unavailable");
});
