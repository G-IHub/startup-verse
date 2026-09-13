/**
 * seedAiDeveloperAgent.mjs — Phase 1 (docs/ai-agent-roadmap.md): creates the
 * real, persistent AI Developer agent + its 3 real action types for one
 * founder. Idempotent (upserts by the model's own unique indexes), safe to
 * re-run. Unlike Phase 0's throwaway seed script, this data is meant to
 * stay — it's the actual agent, not test fixtures to delete after verifying.
 *
 * Usage: FOUNDER_EMAIL=someone@example.com node scripts/seedAiDeveloperAgent.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Agent from "../src/models/Agent.js";
import ActionType from "../src/models/ActionType.js";

const founderEmail = process.env.FOUNDER_EMAIL;
if (!founderEmail) {
  throw new Error("Set FOUNDER_EMAIL to the founder this AI Developer agent belongs to.");
}

await mongoose.connect(process.env.MONGODB_CONNECTION_URI);

const founder = await User.findOne({ email: founderEmail });
if (!founder) throw new Error(`No user found for ${founderEmail}.`);

const agent = await Agent.findOneAndUpdate(
  { founderId: founder._id, agentKey: "dev" },
  {
    founderId: founder._id,
    agentKey: "dev",
    name: "AI Developer",
    role: "Code, deploys, GitHub",
    capabilities: ["write_code", "open_pr", "deploy_staging", "deploy_prod"],
    status: "idle",
    model: "deepseek",
  },
  { upsert: true, new: true },
);

const actionTypes = [
  {
    actionKey: "github_open_pr",
    label: "Write code & open a PR",
    riskCategory: "reversible",
    defaultMode: "autonomous",
    adjustable: true,
    approverRule: "founder",
  },
  {
    actionKey: "github_merge_staging",
    label: "Merge to staging",
    riskCategory: "reversible",
    defaultMode: "autonomous",
    adjustable: true,
    approverRule: "founder",
  },
  {
    actionKey: "github_merge_main",
    label: "Deploy to production",
    riskCategory: "sensitive_locked",
    defaultMode: "ask_first",
    adjustable: false,
    approverRule: "role:engineering",
  },
];

const results = [];
for (const at of actionTypes) {
  const doc = await ActionType.findOneAndUpdate(
    { agentId: agent._id, actionKey: at.actionKey },
    { agentId: agent._id, ...at },
    { upsert: true, new: true },
  );
  results.push({ actionKey: doc.actionKey, id: String(doc._id), riskCategory: doc.riskCategory });
}

console.log(JSON.stringify({
  founderId: String(founder._id),
  agentId: String(agent._id),
  actionTypes: results,
}, null, 2));

await mongoose.disconnect();
