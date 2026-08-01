import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createNotification } from "./notificationService.js";

const originalFindById = User.findById;
const originalNotificationCreate = Notification.create;

test.afterEach(() => {
  User.findById = originalFindById;
  Notification.create = originalNotificationCreate;
});

test("mandatory action notifications bypass disabled preferences", async () => {
  let preferenceLookups = 0;
  let createdPayload = null;

  User.findById = () => ({
    select: () => ({
      lean: async () => {
        preferenceLookups += 1;
        return { notificationPreferences: { all: false } };
      },
    }),
  });
  Notification.create = async (payload) => {
    createdPayload = payload;
    return { _id: "notification-1", ...payload };
  };

  const mandatory = await createNotification({
    userId: "recipient-1",
    type: "interest-received",
    title: "New talent interest",
    message: "A talent expressed interest in your startup.",
    skipPreferences: true,
  });

  assert.equal(preferenceLookups, 0);
  assert.equal(mandatory?._id, "notification-1");
  assert.equal(createdPayload?.userId, "recipient-1");

  createdPayload = null;
  const optional = await createNotification({
    userId: "recipient-1",
    type: "weekly-review-reminder",
    message: "Review your week.",
  });

  assert.equal(preferenceLookups, 1);
  assert.equal(optional, null);
  assert.equal(createdPayload, null);
});
