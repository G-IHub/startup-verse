import test from "node:test";
import assert from "node:assert/strict";
import { resolveNotificationUserId } from "./notificationUserId.js";

test("notification user id supports MongoDB and client user shapes", () => {
  assert.equal(resolveNotificationUserId({ _id: "mongo-user" }), "mongo-user");
  assert.equal(resolveNotificationUserId({ id: "client-user" }), "client-user");
  assert.equal(
    resolveNotificationUserId({ _id: "mongo-user", id: "client-user" }),
    "mongo-user",
  );
  assert.equal(resolveNotificationUserId(null), "");
});
