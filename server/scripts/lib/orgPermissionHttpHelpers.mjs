import request from "supertest";
import Organization from "../../src/models/Organization.js";
import OrganizationAdmin from "../../src/models/OrganizationAdmin.js";
import Cohort from "../../src/models/Cohort.js";
import CohortMembership from "../../src/models/CohortMembership.js";
import Startup from "../../src/models/Startup.js";
import Deliverable from "../../src/models/Deliverable.js";
import DeliverableSubmission from "../../src/models/DeliverableSubmission.js";
import Event from "../../src/models/Event.js";
import Announcement from "../../src/models/Announcement.js";

const API = "/api/v1";

export async function signupAgent(app, role, nameSuffix = "") {
  const email = `perm36_${role}_${nameSuffix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}@example.com`;
  const agent = request.agent(app);
  const res = await agent.post(`${API}/auth/signup`).send({
    name: `Perm ${role}`,
    email,
    password: "PermPass123!",
    role,
  });
  if (res.status !== 201) {
    throw new Error(`signup ${role} failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    agent,
    userId: String(res.body?.data?.user?._id ?? res.body?.data?.user?.id),
    email,
  };
}

export async function seedOrgCohortFixtures(app) {
  const orgAdmin = await signupAgent(app, "organization-admin", "owner");
  const outsider = await signupAgent(app, "talent", "outsider");
  const cohortFounder = await signupAgent(app, "founder", "member");

  const org = await Organization.create({
    name: `Perm Org ${Date.now()}`,
    createdBy: orgAdmin.userId,
  });
  const orgId = String(org._id);
  await OrganizationAdmin.create({
    organizationId: org._id,
    userId: orgAdmin.userId,
  });

  const cohort = await Cohort.create({
    name: `Perm Cohort ${Date.now()}`,
    organizationId: org._id,
    createdBy: orgAdmin.userId,
  });
  const cohortId = String(cohort._id);

  const startup = await Startup.create({
    name: "Perm Startup",
    founderId: cohortFounder.userId,
  });
  const startupId = String(startup._id);

  await CohortMembership.create({
    cohortId: cohort._id,
    founderId: cohortFounder.userId,
    startupId: startup._id,
    status: "active",
  });

  const deliverable = await Deliverable.create({
    cohortId: cohort._id,
    organizationId: org._id,
    title: "Perm Deliverable",
    description: "for permission matrix",
    createdBy: orgAdmin.userId,
  });
  const deliverableId = String(deliverable._id);

  const submission = await DeliverableSubmission.create({
    deliverableId: deliverable._id,
    founderId: cohortFounder.userId,
    startupId: startup._id,
    content: "draft",
    status: "submitted",
  });
  const submissionId = String(submission._id);

  const event = await Event.create({
    cohortId: cohort._id,
    organizationId: org._id,
    title: "Perm Event",
    description: "seed",
    startsAt: new Date(Date.now() + 3 * 86_400_000),
    eventType: "workshop",
    createdBy: orgAdmin.userId,
  });
  const eventId = String(event._id);

  const announcement = await Announcement.create({
    cohortId: cohort._id,
    organizationId: org._id,
    title: "Perm Announcement",
    body: "Read me",
    createdBy: orgAdmin.userId,
  });
  const announcementId = String(announcement._id);

  const futureDate = new Date(Date.now() + 5 * 86_400_000).toISOString();

  return {
    orgAdmin,
    cohortFounder,
    outsider,
    orgId,
    cohortId,
    startupId,
    deliverableId,
    submissionId,
    eventId,
    announcementId,
    futureDate,
  };
}

/**
 * @param {import('supertest').SuperAgentTest} agent
 */
export async function httpRequest(agent, { method, path, body, query }) {
  const m = String(method).toLowerCase();
  let req = agent[m](path);
  if (query && typeof query === "object") {
    req = req.query(query);
  }
  if (body !== undefined) {
    req = req.send(body);
  }
  return req;
}

export { API };
