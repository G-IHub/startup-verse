import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMessageMentionMetadata,
  createMentionFromMilestone,
  createMentionFromTask,
  detectMentionQuery,
  getFilteredMentionables,
  insertMentionIntoText,
  reconcileMentionsWithBody,
} from "./chatMentions.js";

test("detectMentionQuery finds active @ token at caret", () => {
  const text = "Hey @la";
  const result = detectMentionQuery(text, text.length);
  assert.equal(result?.query, "la");
  assert.equal(result?.atIndex, 4);
});

test("detectMentionQuery returns null after whitespace in query", () => {
  const text = "Hey @la ";
  const result = detectMentionQuery(text, text.length);
  assert.equal(result, null);
});

test("insertMentionIntoText replaces active @ query with mention token", () => {
  const text = "Discuss @la";
  const { text: next, caret } = insertMentionIntoText(text, text.length, "Launch MVP");
  assert.equal(next, "Discuss @Launch MVP ");
  assert.equal(caret, "Discuss @Launch MVP ".length);
});

test("getFilteredMentionables filters milestones and tasks", () => {
  const mentionables = {
    milestones: [{ id: "m1", title: "Launch MVP", status: "pending", totalTasks: 2, tasksCompleted: 0 }],
    tasks: [
      {
        id: "t1",
        title: "Fix onboarding",
        status: "pending",
        priority: "high",
        assignedToName: "Alex",
        milestoneName: "Launch MVP",
      },
    ],
  };
  const milestoneOnly = getFilteredMentionables(mentionables, "mvp");
  assert.equal(milestoneOnly.milestones.length, 1);
  const taskOnly = getFilteredMentionables(mentionables, "onboarding");
  assert.equal(taskOnly.tasks.length, 1);
  assert.equal(taskOnly.milestones.length, 0);
});

test("reconcileMentionsWithBody keeps only mentions still present in text", () => {
  const mentions = [
    createMentionFromMilestone({ id: "m1", title: "Launch MVP", status: "pending", totalTasks: 1, tasksCompleted: 0 }),
    createMentionFromTask({
      id: "t1",
      title: "Fix onboarding",
      status: "pending",
      priority: "high",
      assignedToName: "Alex",
      milestoneName: "Launch MVP",
    }),
  ];
  const body = "Please review @Launch MVP";
  const active = reconcileMentionsWithBody(body, mentions);
  assert.equal(active.length, 1);
  assert.equal(active[0].type, "milestone");
});

test("buildMessageMentionMetadata returns mentions payload", () => {
  const mention = createMentionFromTask({
    id: "t1",
    title: "Fix onboarding",
    status: "pending",
    priority: "high",
    assignedToName: "Alex",
    milestoneName: "Launch MVP",
  });
  const metadata = buildMessageMentionMetadata("Check @Fix onboarding", [mention]);
  assert.equal(metadata.mentions.length, 1);
  assert.equal(metadata.mentions[0].id, "t1");
});
