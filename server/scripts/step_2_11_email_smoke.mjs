#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Step 2.11 — Email transport smoke.
 *
 * Three parts:
 *   1. Always-on, no-DB / no-network smoke for the driver resolver,
 *      template renderers, and the log/skip paths in `sendEmail`.
 *   2. Opt-in HTTP smoke (`RUN_EMAIL_HTTP_FLOWS=1`, needs Mongo): walks
 *      `POST /invitations/create` and `POST /mentors/request-link` with
 *      `EMAIL_DRIVER=log` and asserts the controllers still return 2xx.
 *   3. Opt-in live Mailtrap smoke (`RUN_EMAIL_LIVE=1` + `MAILTRAP_API_TOKEN`
 *      + `EMAIL_FROM` + `MAILTRAP_TEST_TO`). One real send.
 *
 * Run from server/:
 *   node scripts/step_2_11_email_smoke.mjs
 *   RUN_EMAIL_HTTP_FLOWS=1 node scripts/step_2_11_email_smoke.mjs
 *   RUN_EMAIL_LIVE=1 node scripts/step_2_11_email_smoke.mjs
 */
import assert from "node:assert/strict";
import process from "node:process";

// ---- Part 1: pure helper smoke -------------------------------------------

const cacheBuster = () => `?t=${Date.now()}_${Math.random()}`;

function clearMailtrapEnv() {
  delete process.env.EMAIL_DRIVER;
  delete process.env.MAILTRAP_API_TOKEN;
  delete process.env.MAILTRAP_USE_SANDBOX;
  delete process.env.MAILTRAP_INBOX_ID;
}

{
  const { resolveEmailDriver } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  clearMailtrapEnv();
  assert.equal(resolveEmailDriver(), "log", "no env -> log driver");
}

{
  const { resolveEmailDriver } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  process.env.MAILTRAP_API_TOKEN = "mt_test_dummy";
  assert.equal(
    resolveEmailDriver(),
    "mailtrap",
    "MAILTRAP_API_TOKEN auto-selects mailtrap driver",
  );
  clearMailtrapEnv();
}

{
  const { resolveEmailDriver } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  process.env.EMAIL_DRIVER = "log";
  process.env.MAILTRAP_API_TOKEN = "mt_test_dummy";
  assert.equal(
    resolveEmailDriver(),
    "log",
    "explicit EMAIL_DRIVER overrides MAILTRAP_API_TOKEN presence",
  );
  clearMailtrapEnv();
}

const { renderCohortInvitationEmail } = await import(
  "../src/services/emailTemplates/cohortInvitation.js"
);
const { renderMentorMagicLinkEmail } = await import(
  "../src/services/emailTemplates/mentorMagicLink.js"
);

{
  const r = renderCohortInvitationEmail({
    organizationName: "<Acme>",
    cohortName: "Spring '26",
    inviterName: '"); alert(1); //',
    inviteUrl: "https://example.com/invitation/abc123",
    message: "Welcome <b>aboard</b>!",
  });
  assert.ok(r.subject.includes("Spring '26"), "subject mentions cohort");
  assert.ok(r.html.includes("https://example.com/invitation/abc123"), "html contains invite URL");
  assert.ok(r.text.includes("https://example.com/invitation/abc123"), "text contains invite URL");
  assert.ok(!r.html.includes("<Acme>"), "raw < not present in html");
  assert.ok(r.html.includes("&lt;Acme&gt;"), "org name HTML-escaped");
  assert.ok(
    r.html.includes("&quot;") && r.html.includes("&#39;"),
    "inviter name's quotes are HTML-entity escaped",
  );
  assert.ok(r.html.includes("&lt;b&gt;aboard&lt;/b&gt;"), "message HTML-escaped");
}

{
  let threw = false;
  try {
    renderCohortInvitationEmail({ cohortName: "x" });
  } catch (err) {
    threw = /inviteUrl is required/.test(err.message);
  }
  assert.ok(threw, "missing inviteUrl throws");
}

{
  const r = renderMentorMagicLinkEmail({
    organizationName: "<Acme>",
    magicLinkUrl: "https://example.com/mentor/tok-xyz",
  });
  assert.ok(r.subject.toLowerCase().includes("mentor"), "subject mentions mentor");
  assert.ok(r.html.includes("https://example.com/mentor/tok-xyz"), "html contains magic link");
  assert.ok(r.text.includes("https://example.com/mentor/tok-xyz"), "text contains magic link");
  assert.ok(r.html.includes("&lt;Acme&gt;"), "org name HTML-escaped");
}

{
  const { parseEmailAddress } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  assert.deepEqual(parseEmailAddress("Acme <noreply@acme.com>"), {
    name: "Acme",
    email: "noreply@acme.com",
  });
  assert.deepEqual(parseEmailAddress("noreply@acme.com"), {
    email: "noreply@acme.com",
  });
}

{
  const { sendEmail, __resetEmailServiceForTests } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  __resetEmailServiceForTests();

  const skipped = await sendEmail({});
  assert.equal(skipped.sent, false, "missing to/subject -> sent:false");
  assert.equal(skipped.mode, "skipped", "missing to/subject -> mode:skipped");

  const logged = await sendEmail({
    to: "user@example.com",
    subject: "hello",
    text: "world",
  });
  assert.equal(logged.sent, false, "log driver does not actually send");
  assert.equal(logged.mode, "log", "log driver returns mode:log");
}

{
  const { sendEmail, __resetEmailServiceForTests } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  process.env.EMAIL_DRIVER = "mailtrap";
  process.env.MAILTRAP_API_TOKEN = "mt_test_dummy";
  delete process.env.EMAIL_FROM;
  __resetEmailServiceForTests();

  const result = await sendEmail({
    to: "user@example.com",
    subject: "hello",
    text: "world",
  });
  assert.equal(result.sent, false, "no EMAIL_FROM -> sent:false");
  assert.equal(result.mode, "skipped", "no EMAIL_FROM -> mode:skipped");
  assert.match(String(result.error), /EMAIL_FROM/, "error mentions EMAIL_FROM");
  clearMailtrapEnv();
}

{
  const { publicAppUrl } = await import(
    `../src/utils/publicAppUrl.js${cacheBuster()}`
  );
  delete process.env.PUBLIC_APP_URL;
  delete process.env.CLIENT_URL;
  delete process.env.FRONTEND_URL;
  assert.equal(publicAppUrl(), "", "no env -> empty string");
  process.env.PUBLIC_APP_URL = "https://app.example.com/";
  assert.equal(
    publicAppUrl(),
    "https://app.example.com",
    "trailing slash stripped",
  );
  delete process.env.PUBLIC_APP_URL;
  process.env.FRONTEND_URL = "https://fe.example.com";
  assert.equal(publicAppUrl(), "https://fe.example.com", "FRONTEND_URL fallback");
  delete process.env.FRONTEND_URL;
}

console.log("Part 1: emailService + templates smoke PASSED");

// ---- Part 2: HTTP integration smoke (opt-in) ------------------------------

if (process.env.RUN_EMAIL_HTTP_FLOWS === "1") {
  process.env.EMAIL_DRIVER = "log";
  delete process.env.MAILTRAP_API_TOKEN;

  const request = (await import("supertest")).default;
  const mongoose = (await import("mongoose")).default;
  const { connectDatabase } = await import("../src/config/db.js");
  const { default: app } = await import("../src/app.js");
  const Organization = (await import("../src/models/Organization.js")).default;
  const OrganizationAdmin = (
    await import("../src/models/OrganizationAdmin.js")
  ).default;
  const Cohort = (await import("../src/models/Cohort.js")).default;

  await connectDatabase();

  async function signup(role) {
    const email = `mail_${role}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}@example.com`;
    const res = await request(app).post("/api/v1/auth/signup").send({
      name: `Mail ${role}`,
      email,
      password: "EmailPass123!",
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
    name: `Mail Org ${Date.now()}`,
    createdBy: orgOwner.userId,
  });
  await OrganizationAdmin.create({
    organizationId: org._id,
    userId: orgOwner.userId,
  });
  const cohort = await Cohort.create({
    organizationId: org._id,
    name: `Mail Cohort ${Date.now()}`,
  });

  const inviteRes = await request(app)
    .post("/api/v1/invitations/create")
    .set("Authorization", `Bearer ${orgOwner.token}`)
    .send({
      cohortId: String(cohort._id),
      email: `invitee_${Date.now()}@example.com`,
      message: "Welcome aboard!",
    });
  assert.equal(inviteRes.status, 201, "invitation create returns 201");
  assert.equal(inviteRes.body?.success, true, "invitation envelope success");

  const target = await signup("founder");
  const linkRes = await request(app)
    .post("/api/v1/mentors/request-link")
    .send({ email: target.email });
  assert.equal(linkRes.status, 200, "mentor request-link returns 200");
  assert.equal(linkRes.body?.success, true, "mentor link envelope success");

  await mongoose.disconnect();
  console.log("Part 2: HTTP email smoke PASSED");
} else {
  console.log(
    "Part 2: HTTP smoke SKIP (set RUN_EMAIL_HTTP_FLOWS=1 and Mongo env to run).",
  );
}

// ---- Part 3: Live Mailtrap smoke (opt-in) ---------------------------------

if (process.env.RUN_EMAIL_LIVE === "1") {
  if (
    !process.env.MAILTRAP_API_TOKEN ||
    !process.env.EMAIL_FROM ||
    !process.env.MAILTRAP_TEST_TO
  ) {
    console.error(
      "Part 3: needs MAILTRAP_API_TOKEN, EMAIL_FROM, and MAILTRAP_TEST_TO.",
    );
    process.exit(1);
  }
  process.env.EMAIL_DRIVER = "mailtrap";
  const { sendEmail, __resetEmailServiceForTests } = await import(
    `../src/services/emailService.js${cacheBuster()}`
  );
  __resetEmailServiceForTests();

  const result = await sendEmail({
    to: process.env.MAILTRAP_TEST_TO,
    subject: "StartupVerse Step 2.11 smoke",
    text: "If you can read this, the Mailtrap driver works.",
    tags: [{ name: "kind", value: "smoke" }],
  });
  assert.equal(result.sent, true, "live send returns sent:true");
  assert.equal(result.mode, "mailtrap", "live send mode is mailtrap");
  assert.ok(result.id, "live send returns an id");
  console.log("Part 3: live Mailtrap send PASSED", { id: result.id });
} else {
  console.log(
    "Part 3: live Mailtrap smoke SKIP (set RUN_EMAIL_LIVE=1 + MAILTRAP_API_TOKEN + EMAIL_FROM + MAILTRAP_TEST_TO).",
  );
}

console.log("done");
