import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV ||= "test";
process.env.JWT_SECRET ||= "test-secret-value";
process.env.GITHUB_TOKEN_ENCRYPTION_KEY ||= "a".repeat(32);

const [
  { getTask, postTaskComment },
  { createJoinRequest },
  { importIssues },
  { createTaskComment },
  { default: Task },
  { default: TaskComment },
  { default: User },
  { default: Startup },
  { default: Cohort },
  { default: GitHubConnection },
  { encryptGithubToken },
] = await Promise.all([
  import("./taskDetail.controller.js"),
  import("./programs.controller.js"),
  import("./github.controller.js"),
  import("../services/taskCommentService.js"),
  import("../models/Task.js"),
  import("../models/TaskComment.js"),
  import("../models/User.js"),
  import("../models/Startup.js"),
  import("../models/Cohort.js"),
  import("../models/GitHubConnection.js"),
  import("../utils/githubCrypto.js"),
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

test("getTask returns 403 when the user is not on the startup", async () => {
  const originals = {
    taskFindById: Task.findById,
    userFindById: User.findById,
    startupFindOne: Startup.findOne,
    commentCount: TaskComment.countDocuments,
  };
  Task.findById = async () => ({
    _id: "task-1",
    founderId: "founder-1",
    startupId: "startup-1",
    toObject() {
      return {
        _id: "task-1",
        founderId: "founder-1",
        startupId: "startup-1",
      };
    },
  });
  User.findById = () => ({
    lean: async () => ({ _id: "outsider", startupId: "other-startup" }),
  });
  Startup.findOne = () => ({ lean: async () => null });
  TaskComment.countDocuments = async () => 0;

  const res = response();
  await getTask(
    {
      params: { taskId: "task-1", founderId: "founder-1" },
      user: { id: "outsider", role: "founder" },
    },
    res,
  );

  Task.findById = originals.taskFindById;
  User.findById = originals.userFindById;
  Startup.findOne = originals.startupFindOne;
  TaskComment.countDocuments = originals.commentCount;

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload?.success, false);
});

test("postTaskComment returns 422 when the comment body is empty", async () => {
  const originals = {
    taskFindById: Task.findById,
    userFindById: User.findById,
    startupFindOne: Startup.findOne,
  };
  Task.findById = async () => ({
    _id: "task-1",
    founderId: "founder-1",
    startupId: "startup-1",
  });
  User.findById = () => ({
    lean: async () => ({ _id: "founder-1", startupId: "startup-1" }),
  });
  Startup.findOne = () => ({ lean: async () => ({ _id: "startup-1" }) });

  const res = response();
  await postTaskComment(
    {
      params: { taskId: "task-1", founderId: "founder-1" },
      user: { id: "founder-1", role: "founder" },
      body: { body: "   " },
    },
    res,
  );

  Task.findById = originals.taskFindById;
  User.findById = originals.userFindById;
  Startup.findOne = originals.startupFindOne;

  assert.equal(res.statusCode, 422);
});

test("createTaskComment rejects a blank body with 422", async () => {
  await assert.rejects(
    () =>
      createTaskComment({
        task: { _id: "task-1" },
        authorId: "user-1",
        body: " ",
      }),
    (err) => err.status === 422,
  );
});

test("createJoinRequest returns 404 for an unlisted program", async () => {
  const original = Cohort.findOne;
  Cohort.findOne = async () => ({
    _id: "cohort-1",
    listed: false,
    deletedAt: null,
  });

  const res = response();
  await createJoinRequest(
    {
      params: { cohortId: "cohort-1" },
      user: { id: "founder-1", role: "founder" },
      body: {},
    },
    res,
  );

  Cohort.findOne = original;
  assert.equal(res.statusCode, 404);
});

test("importIssues skips an issue already imported for the startup", async () => {
  const originals = {
    startupFindOne: Startup.findOne,
    connectionFindOne: GitHubConnection.findOne,
    taskFindOne: Task.findOne,
    taskCreate: Task.create,
  };

  Startup.findOne = async () => ({ _id: "startup-1" });
  GitHubConnection.findOne = async () => ({
    userId: "founder-1",
    accessTokenEncrypted: encryptGithubToken("github-token"),
    revokedAt: null,
  });
  Task.findOne = async () => ({ _id: "existing-task" });
  Task.create = async () => {
    throw new Error("should not create a duplicate task");
  };

  const res = response();
  await importIssues(
    {
      user: { id: "founder-1", role: "founder" },
      body: { owner: "acme", repo: "app", issueNumbers: [12] },
    },
    res,
  );

  Startup.findOne = originals.startupFindOne;
  GitHubConnection.findOne = originals.connectionFindOne;
  Task.findOne = originals.taskFindOne;
  Task.create = originals.taskCreate;

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload?.data?.created?.length, 0);
  assert.equal(res.payload?.data?.skipped?.length, 1);
  assert.equal(res.payload?.data?.skipped?.[0]?.reason, "already imported");
});
