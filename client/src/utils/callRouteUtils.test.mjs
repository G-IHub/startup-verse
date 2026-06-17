import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOfficeCallPath,
  parseOfficeCallRoute,
  isOfficeCallPath,
} from "./callRouteUtils.js";

test("buildOfficeCallPath encodes room name and call type", () => {
  assert.equal(
    buildOfficeCallPath("call-123-user", "video"),
    "/office/call/call-123-user?type=video",
  );
  assert.equal(
    buildOfficeCallPath("call-123-user", "voice"),
    "/office/call/call-123-user?type=voice",
  );
});

test("parseOfficeCallRoute reads room name and type from office call URLs", () => {
  assert.deepEqual(
    parseOfficeCallRoute("/office/call/call-123-user", "?type=voice"),
    { roomName: "call-123-user", callType: "voice" },
  );
  assert.deepEqual(
    parseOfficeCallRoute("/office/call/call%2Fspecial", "?type=video"),
    { roomName: "call/special", callType: "video" },
  );
  assert.equal(parseOfficeCallRoute("/office", ""), null);
});

test("isOfficeCallPath detects active call routes", () => {
  assert.equal(isOfficeCallPath("/office/call/call-abc"), true);
  assert.equal(isOfficeCallPath("/office"), false);
});
