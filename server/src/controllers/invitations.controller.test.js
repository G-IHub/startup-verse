import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV ||= "test";
process.env.PORT ||= "3001";
process.env.CORS_ORIGIN ||= "http://localhost";
process.env.JWT_SECRET ||= "test-secret-value";
process.env.JWT_EXPIRES_IN ||= "1h";
process.env.MONGODB_CONNECTION_URI ||=
  "mongodb://127.0.0.1:27017/startupverse-test";

const [
  { default: mongoose },
  { onboardInterest },
  { default: Interest },
  { default: User },
  { default: TeamMemberProfile },
  { default: Presence },
  { default: Activity },
  { default: Notification },
] = await Promise.all([
  import("mongoose"),
  import("./invitations.controller.js"),
  import("../models/Interest.js"),
  import("../models/User.js"),
  import("../models/TeamMemberProfile.js"),
  import("../models/Presence.js"),
  import("../models/Activity.js"),
  import("../models/Notification.js"),
]);

test("interest onboarding stores the submitted compensation", async () => {
  const originals = {
    startSession: mongoose.startSession,
    interestFindById: Interest.findById,
    userFindById: User.findById,
    profileFindOneAndUpdate: TeamMemberProfile.findOneAndUpdate,
    presenceFindOneAndUpdate: Presence.findOneAndUpdate,
    activityCreate: Activity.create,
    notificationCreate: Notification.create,
  };

  const compensationConfig = {
    type: "equity",
    equity: {
      totalEquity: "2",
      vestingPeriod: "48",
      cliffEnabled: true,
      cliffPeriod: "6",
      vestingFrequency: "monthly",
      performanceGated: true,
      threshold: "80",
      partialVesting: false,
      partialScale: null,
    },
  };
  let profileUpdate = null;

  const interest = {
    _id: "interest-1",
    founderId: "founder-1",
    talentId: "talent-1",
    startupId: "startup-1",
    status: "accepted",
    onboarded: false,
    save: async () => {},
  };
  const talent = {
    _id: "talent-1",
    name: "Taylor",
    save: async () => {},
  };

  mongoose.startSession = async () => ({
    withTransaction: async (work) => work(),
    endSession: async () => {},
  });
  Interest.findById = () => ({
    session: async () => interest,
  });
  User.findById = (id) => ({
    session: async () => {
      assert.equal(String(id), "talent-1");
      return talent;
    },
    select: () => ({
      lean: async () => ({ notificationPreferences: {} }),
    }),
  });
  TeamMemberProfile.findOneAndUpdate = async (_query, update) => {
    profileUpdate = update;
    return update;
  };
  Presence.findOneAndUpdate = async () => ({});
  Activity.create = async () => [
    {
      _id: "activity-1",
      startupId: "founder-1",
      userId: "talent-1",
      type: "join",
      text: "Team member onboarded from accepted interest.",
      metadata: {},
    },
  ];
  Notification.create = async (notification) => ({
    _id: "notification-1",
    ...notification,
  });

  const response = {
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

  try {
    await onboardInterest(
      {
        params: { interestId: "interest-1" },
        body: { compensationConfig },
        user: { id: "founder-1" },
      },
      response,
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.success, true);
    assert.deepEqual(profileUpdate.compensation, compensationConfig);

    interest.status = "proposed-by-founder";
    profileUpdate = null;
    response.statusCode = null;
    response.payload = null;

    await onboardInterest(
      {
        params: { interestId: "interest-1" },
        body: { compensationConfig },
        user: { id: "talent-1" },
      },
      response,
    );

    assert.equal(response.statusCode, 403);
    assert.equal(profileUpdate, null);

    profileUpdate = null;
    response.statusCode = null;
    response.payload = null;

    await onboardInterest(
      {
        params: { interestId: "interest-1" },
        body: { compensationConfig: { type: "equity" } },
        user: { id: "founder-1" },
      },
      response,
    );

    assert.equal(response.statusCode, 422);
    assert.equal(profileUpdate, null);

    response.statusCode = null;
    response.payload = null;

    await onboardInterest(
      {
        params: { interestId: "interest-1" },
        body: {
          compensationConfig: {
            ...compensationConfig,
            equity: {
              ...compensationConfig.equity,
              unexpected: { arbitrary: true },
            },
          },
        },
        user: { id: "founder-1" },
      },
      response,
    );

    assert.equal(response.statusCode, 422);
  } finally {
    mongoose.startSession = originals.startSession;
    Interest.findById = originals.interestFindById;
    User.findById = originals.userFindById;
    TeamMemberProfile.findOneAndUpdate = originals.profileFindOneAndUpdate;
    Presence.findOneAndUpdate = originals.presenceFindOneAndUpdate;
    Activity.create = originals.activityCreate;
    Notification.create = originals.notificationCreate;
  }
});
