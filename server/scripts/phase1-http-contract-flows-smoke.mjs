/**
 * Phase 1.3 — supertest flows against a real MongoDB (requires full server env).
 *
 * Run from server/ with env already loaded (e.g. `.env`):
 *   RUN_CONTRACT_HTTP_FLOWS=1 node scripts/phase1-http-contract-flows-smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";
import request from "supertest";
import mongoose from "mongoose";

async function main() {
  if (process.env.RUN_CONTRACT_HTTP_FLOWS !== "1") {
    console.log("Phase 1 HTTP contract flows SKIP (set RUN_CONTRACT_HTTP_FLOWS=1 and Mongo env)");
    return;
  }

  const { connectDatabase } = await import("../src/config/db.js");
  const { default: app } = await import("../src/app.js");

  await connectDatabase();

  const email = `contract_${Date.now()}@example.com`;
  const signup = await request(app).post("/api/v1/auth/signup").send({
    name: "Contract User",
    email,
    password: "ContractPass123!",
    role: "talent",
  });
  assert.equal(signup.status, 201);
  assert.equal(signup.body?.success, true);
  const token = signup.body?.data?.token;
  assert.ok(typeof token === "string" && token.length > 10);
  const userA = signup.body?.data?.user;
  const userAId = userA?._id ?? userA?.id;
  assert.ok(userAId);

  const emailB = `contract_b_${Date.now()}@example.com`;
  const signupB = await request(app).post("/api/v1/auth/signup").send({
    name: "Contract User B",
    email: emailB,
    password: "ContractPass123!",
    role: "talent",
  });
  assert.equal(signupB.status, 201);
  const userB = signupB.body?.data?.user;
  const userBId = userB?._id ?? userB?.id;
  assert.ok(userBId);

  const crossUser = await request(app)
    .get(`/api/v1/users/${userBId}`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(crossUser.status, 403);

  const feed = await request(app)
    .get("/api/v1/talent/startup-posts")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(feed.status, 200);
  assert.equal(feed.body?.success, true);
  assert.ok(Array.isArray(feed.body?.data?.posts));

  const noAuth = await request(app).get("/api/v1/users/000000000000000000000001");
  assert.equal(noAuth.status, 401);

  const peerNotif = await request(app)
    .get(`/api/v1/users/${userBId}/notifications`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(peerNotif.status, 403);

  const ReminderJob = (await import("../src/models/ReminderJob.js")).default;
  const { processReminderJobsOnce } = await import("../src/services/reminderDeliveryQueue.js");

  const reminder = await request(app)
    .post("/api/v1/notifications/weekly-outcome-reminder")
    .set("Authorization", `Bearer ${token}`)
    .send({ userId: String(userAId), message: "contract reminder" });
  assert.equal(reminder.status, 201);

  const jobCount = await ReminderJob.countDocuments({ type: "notification_emit" });
  assert.ok(jobCount >= 1, "expected ReminderJob for critical notification when realtime emit is deferred");

  await processReminderJobsOnce(15);

  const reminderRes = await request(app)
    .post("/api/v1/notifications/weekly-outcome-reminder")
    .set("Authorization", `Bearer ${token}`)
    .send({ userId: String(userAId), message: "second" });
  assert.equal(reminderRes.status, 201);
  await processReminderJobsOnce(15);

  const metrics = await ReminderJob.aggregate([
    { $match: { type: "notification_emit" } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  assert.ok(Array.isArray(metrics));

  await mongoose.disconnect();
  console.log("Phase 1 HTTP contract flows smoke PASSED");
}

main().catch(async (e) => {
  console.error("Phase 1 HTTP contract flows smoke FAILED:", e);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
