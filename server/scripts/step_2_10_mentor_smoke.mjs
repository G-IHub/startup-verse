#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.10 — Mentor invite tighten + update smoke.
 *
 * Two parts:
 *   1. Always-on (no DB / no network). Asserts the controller surfaces the
 *      `updateMentorById` export and the synchronous validation branches
 *      return 400 without touching the database.
 *   2. Opt-in HTTP smoke (`RUN_MENTOR_HTTP_FLOWS=1`, needs Mongo). Drives
 *      the real endpoints and asserts negative + happy paths plus the
 *      stable `code` strings the UI branches on.
 *
 * Run from server/:
 *   node scripts/step_2_10_mentor_smoke.mjs
 *   RUN_MENTOR_HTTP_FLOWS=1 node scripts/step_2_10_mentor_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

// Default the email driver to "log" so Part 2 doesn't try to hit Mailtrap.
if (!process.env.EMAIL_DRIVER) process.env.EMAIL_DRIVER = "log";

// ---- Part 1: synchronous controller smoke (no DB) ------------------------

{
  const mentorsController = await import(
    "../src/controllers/mentors.controller.js"
  );
  assert.equal(
    typeof mentorsController.updateMentorById,
    "function",
    "updateMentorById is exported",
  );
  assert.equal(
    typeof mentorsController.inviteOrganizationMentor,
    "function",
    "inviteOrganizationMentor is exported",
  );

  function makeRes() {
    return {
      statusCode: 200,
      body: null,
      req: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
  }

  // Empty body -> 400 "Provide at least one of..." (does not reach DB).
  {
    const res = makeRes();
    await mentorsController.updateMentorById({ params: { mentorId: "x" }, body: {} }, res);
    assert.equal(res.statusCode, 400, "empty body returns 400");
    assert.match(res.body?.message || "", /Provide at least one/i, "400 message mentions Provide at least one");
  }

  // Invalid status -> 400 (does not reach DB).
  {
    const res = makeRes();
    await mentorsController.updateMentorById(
      { params: { mentorId: "x" }, body: { status: "bogus" } },
      res,
    );
    assert.equal(res.statusCode, 400, "invalid status returns 400");
    assert.match(res.body?.message || "", /status must be/i, "400 message mentions status");
  }
}

console.log("Part 1: controller synchronous smoke PASSED");

// ---- Part 2: HTTP integration smoke (opt-in) ------------------------------

if (process.env.RUN_MENTOR_HTTP_FLOWS !== "1") {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_MENTOR_HTTP_FLOWS=1 and Mongo env to run).",
  );
  process.exit(0);
}

const request = (await import("supertest")).default;
const mongoose = (await import("mongoose")).default;
const { connectDatabase } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const Organization = (await import("../src/models/Organization.js")).default;
const OrganizationAdmin = (await import("../src/models/OrganizationAdmin.js"))
  .default;
const MentorProfile = (await import("../src/models/MentorProfile.js")).default;

await connectDatabase();

async function signup(role) {
  const email = `mentor_${role}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;
  const res = await request(app).post("/api/v1/auth/signup").send({
    name: `Mentor ${role}`,
    email,
    password: "MentorPass123!",
    role,
  });
  assert.equal(res.status, 201, `signup ${role} should 201`);
  return {
    token: res.body?.data?.token,
    userId: String(res.body?.data?.user?._id ?? res.body?.data?.user?.id),
    email,
  };
}

const orgOwner = await signup("organization");
const org = await Organization.create({
  name: `Mentor Org ${Date.now()}`,
  createdBy: orgOwner.userId,
});
await OrganizationAdmin.create({
  organizationId: org._id,
  userId: orgOwner.userId,
});

// 404 — unregistered email.
{
  const res = await request(app)
    .post(`/api/v1/organizations/${org._id}/mentors`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({ email: `nobody_${Date.now()}@example.com`, expertise: "growth" });
  assert.equal(res.status, 404, "unregistered email -> 404");
  assert.equal(
    res.body?.code,
    "NOT_A_REGISTERED_USER",
    "unregistered email -> code NOT_A_REGISTERED_USER",
  );
}

// 201 — registered founder becomes mentor.
const founder = await signup("founder");
let mentorId = null;
{
  const res = await request(app)
    .post(`/api/v1/organizations/${org._id}/mentors`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({ email: founder.email, expertise: "product, sales" });
  assert.equal(res.status, 201, "registered email -> 201");
  mentorId = res.body?.data?.mentor?.id;
  assert.ok(mentorId, "mentor id present in response");

  const row = await MentorProfile.findById(mentorId).lean();
  assert.ok(row?.token, "MentorProfile has a magic-link token");
  assert.equal(row.status, "active", "new mentor defaults to active status");
}

// 409 — re-inviting the same user.
{
  const res = await request(app)
    .post(`/api/v1/organizations/${org._id}/mentors`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({ email: founder.email });
  assert.equal(res.status, 409, "duplicate invite -> 409");
  assert.equal(
    res.body?.code,
    "MENTOR_ALREADY_LINKED",
    "duplicate invite -> code MENTOR_ALREADY_LINKED",
  );
}

// 200 — PUT updates expertise + status.
{
  const res = await request(app)
    .put(`/api/v1/mentors/${mentorId}`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({ expertise: "growth, sales", status: "revoked" });
  assert.equal(res.status, 200, "PUT returns 200");
  const m = res.body?.data?.mentor;
  assert.deepEqual(
    m?.expertise,
    ["growth", "sales"],
    "expertise CSV split into array",
  );
  assert.equal(m?.status, "revoked", "status persists");
}

// 400 — invalid status.
{
  const res = await request(app)
    .put(`/api/v1/mentors/${mentorId}`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({ status: "bogus" });
  assert.equal(res.status, 400, "invalid status -> 400");
}

// 404 — unknown mentor id.
{
  const bogus = new mongoose.Types.ObjectId().toString();
  const res = await request(app)
    .put(`/api/v1/mentors/${bogus}`)
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({ status: "active" });
  assert.equal(res.status, 404, "unknown mentor id -> 404");
}

await mongoose.disconnect();
console.log("Part 2: HTTP mentor smoke PASSED");
