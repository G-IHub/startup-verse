import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV ||= "test";
process.env.JWT_SECRET ||= "test-secret-value";
process.env.JWT_EXPIRES_IN ||= "1h";

const [
  { default: mongoose },
  { completeOrganizationOnboarding },
  { default: Organization },
  { default: OrganizationAdmin },
  { default: User },
] = await Promise.all([
  import("mongoose"),
  import("./organizations.controller.js"),
  import("../models/Organization.js"),
  import("../models/OrganizationAdmin.js"),
  import("../models/User.js"),
]);

function response() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return payload;
    },
  };
}

function validBody() {
  return {
    name: "Enovate Lab",
    description: "A program for ambitious founders.",
    organizationType: "Accelerator",
    expectedCohorts: "3-4 cohorts per year",
    expectedStartups: "11-25 startups",
    programDuration: "4-6 months",
    teamSize: "2-5",
    supportedStages: ["Idea"],
    supportedIndustries: ["Technology"],
  };
}

test("organization onboarding creates an organization and completes the organization-admin account", async () => {
  const originals = {
    startSession: mongoose.startSession,
    userFindById: User.findById,
    membershipFindOne: OrganizationAdmin.findOne,
    organizationCreate: Organization.create,
    membershipCreate: OrganizationAdmin.create,
  };
  const user = {
    _id: "user-1",
    role: "organization-admin",
    profile: {},
    onboardingComplete: false,
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
  };
  let createdOrganization = null;
  let createdMembership = null;

  mongoose.startSession = async () => ({
    withTransaction: async (work) => work(),
    endSession: async () => {},
  });
  User.findById = () => ({ session: async () => user });
  OrganizationAdmin.findOne = () => ({ session: async () => null });
  Organization.create = async ([payload]) => {
    createdOrganization = { _id: "organization-1", ...payload };
    return [createdOrganization];
  };
  OrganizationAdmin.create = async ([payload]) => {
    createdMembership = payload;
    return [payload];
  };

  try {
    const res = response();
    await completeOrganizationOnboarding(
      { user: { id: "user-1", role: "organization-admin" }, body: validBody() },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.data.created, true);
    assert.equal(createdOrganization.name, "Enovate Lab");
    assert.deepEqual(createdOrganization.settings.supportedStages, ["Idea"]);
    assert.deepEqual(createdMembership, {
      organizationId: "organization-1",
      userId: "user-1",
    });
    assert.equal(user.onboardingComplete, true);
    assert.equal(user.profile.organizationId, "organization-1");
    assert.equal(user.saveCalls, 1);
  } finally {
    mongoose.startSession = originals.startSession;
    User.findById = originals.userFindById;
    OrganizationAdmin.findOne = originals.membershipFindOne;
    Organization.create = originals.organizationCreate;
    OrganizationAdmin.create = originals.membershipCreate;
  }
});

test("organization onboarding rejects non-organization-admin users", async () => {
  const res = response();
  await completeOrganizationOnboarding(
    { user: { id: "user-1", role: "founder" }, body: validBody() },
    res,
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.success, false);
});

test("organization onboarding retries update the existing organization without another membership", async () => {
  const originals = {
    startSession: mongoose.startSession,
    userFindById: User.findById,
    membershipFindOne: OrganizationAdmin.findOne,
    organizationFindById: Organization.findById,
    organizationCreate: Organization.create,
    membershipCreate: OrganizationAdmin.create,
  };
  const user = {
    _id: "user-1",
    role: "organization-admin",
    profile: {},
    onboardingComplete: false,
    async save() {},
  };
  const organization = {
    _id: "organization-1",
    name: "Old name",
    description: "Old description",
    settings: {},
    markModified() {},
    async save() {},
  };
  let organizationCreates = 0;
  let membershipCreates = 0;

  mongoose.startSession = async () => ({
    withTransaction: async (work) => work(),
    endSession: async () => {},
  });
  User.findById = () => ({ session: async () => user });
  OrganizationAdmin.findOne = () => ({
    session: async () => ({ organizationId: "organization-1" }),
  });
  Organization.findById = () => ({ session: async () => organization });
  Organization.create = async () => {
    organizationCreates += 1;
    return [];
  };
  OrganizationAdmin.create = async () => {
    membershipCreates += 1;
    return [];
  };

  try {
    const res = response();
    await completeOrganizationOnboarding(
      { user: { id: "user-1", role: "organization-admin" }, body: validBody() },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.data.created, false);
    assert.equal(organizationCreates, 0);
    assert.equal(membershipCreates, 0);
    assert.equal(organization.name, "Enovate Lab");
    assert.equal(user.profile.organizationId, "organization-1");
  } finally {
    mongoose.startSession = originals.startSession;
    User.findById = originals.userFindById;
    OrganizationAdmin.findOne = originals.membershipFindOne;
    Organization.findById = originals.organizationFindById;
    Organization.create = originals.organizationCreate;
    OrganizationAdmin.create = originals.membershipCreate;
  }
});

test("organization onboarding does not complete the account if organization creation fails", async () => {
  const originals = {
    startSession: mongoose.startSession,
    userFindById: User.findById,
    membershipFindOne: OrganizationAdmin.findOne,
    organizationCreate: Organization.create,
  };
  const user = {
    _id: "user-1",
    role: "organization-admin",
    profile: {},
    onboardingComplete: false,
    async save() {
      throw new Error("User should not be saved");
    },
  };

  mongoose.startSession = async () => ({
    withTransaction: async (work) => work(),
    endSession: async () => {},
  });
  User.findById = () => ({ session: async () => user });
  OrganizationAdmin.findOne = () => ({ session: async () => null });
  Organization.create = async () => {
    throw new Error("Database write failed");
  };

  try {
    await assert.rejects(
      completeOrganizationOnboarding(
        { user: { id: "user-1", role: "organization-admin" }, body: validBody() },
        response(),
      ),
      /Database write failed/,
    );
    assert.equal(user.onboardingComplete, false);
    assert.deepEqual(user.profile, {});
  } finally {
    mongoose.startSession = originals.startSession;
    User.findById = originals.userFindById;
    OrganizationAdmin.findOne = originals.membershipFindOne;
    Organization.create = originals.organizationCreate;
  }
});
