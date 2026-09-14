/**
 * coreAgentSeeds.js — auto-provisions a founder's real AI Staff agents the
 * first time they're needed, instead of requiring a manual seed script per
 * founder (docs/ai-agent-roadmap.md Phase 1 shipped with scripts/
 * seedAiDeveloperAgent.mjs, which is fine for verifying the loop once but is
 * not what a real founder experiences — Manage Staff's UI already shows AI
 * Developer as hired for every founder, so the backing Agent/ActionType rows
 * should just exist by the time anyone looks).
 *
 * Definitions here are the same shape scripts/seedAiDeveloperAgent.mjs used;
 * this is the version that actually runs for real users. Add a new agent's
 * definition here (not a new one-off script) when Phase 3 brings the next
 * real agent online.
 */
import Agent from "../models/Agent.js";
import ActionType from "../models/ActionType.js";

const CORE_AGENT_DEFINITIONS = [
  {
    agentKey: "pm",
    name: "AI Product Manager",
    role: "Strategy, roadmap, sprint planning",
    capabilities: ["chat", "propose_sprint_plan"],
    model: "deepseek",
    actionTypes: [
      {
        actionKey: "propose_sprint_plan",
        label: "Propose a sprint plan",
        riskCategory: "reversible",
        defaultMode: "ask_first",
        adjustable: true,
        approverRule: "founder",
      },
      {
        actionKey: "update_task",
        label: "Update a task",
        riskCategory: "reversible",
        defaultMode: "ask_first",
        adjustable: true,
        approverRule: "founder",
      },
      {
        // Deletion loses real data with no undo in this schema — kept
        // non-adjustable (unlike update_task) so it can never be flipped to
        // autonomous later just because it's run safely a few times, the
        // same reasoning github_merge_main (deploy_prod) is locked for.
        actionKey: "delete_task",
        label: "Delete a task",
        riskCategory: "sensitive_locked",
        defaultMode: "ask_first",
        adjustable: false,
        approverRule: "founder",
      },
      {
        actionKey: "delete_milestone",
        label: "Delete a milestone",
        riskCategory: "sensitive_locked",
        defaultMode: "ask_first",
        adjustable: false,
        approverRule: "founder",
      },
      {
        actionKey: "update_goal",
        label: "Update the weekly goal",
        riskCategory: "reversible",
        defaultMode: "ask_first",
        adjustable: true,
        approverRule: "founder",
      },
      {
        // Same tier as update_task: adding real tasks under an already-
        // approved milestone is reversible (they can be deleted) and no
        // riskier than editing one, so it gets the same ask_first-by-
        // default-but-adjustable treatment, not sensitive_locked like
        // delete. Used both for a founder's own request in chat and for
        // AI PM's autonomous continuous-planning check-in (2026-09-14) —
        // either way, creating tasks always needs a real approval before
        // AI Developer ever starts on them.
        actionKey: "add_tasks",
        label: "Add tasks to a milestone",
        riskCategory: "reversible",
        defaultMode: "ask_first",
        adjustable: true,
        approverRule: "founder",
      },
    ],
  },
  {
    agentKey: "dev",
    name: "AI Developer",
    role: "Code, deploys, GitHub",
    capabilities: ["write_code", "open_pr", "deploy_staging", "deploy_prod"],
    model: "deepseek",
    actionTypes: [
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
      {
        // Read-only, no side effects — always executes immediately regardless
        // of mode (see orchestrator.service.js's proposeAction branching),
        // same as any read_only action. Lets AI PM answer "what did this PR
        // actually do" or "what is this repo" with real file/diff content
        // instead of only ever seeing event metadata.
        actionKey: "read_repo_content",
        label: "Read repo content",
        riskCategory: "read_only",
        defaultMode: "autonomous",
        adjustable: false,
        approverRule: "founder",
      },
      {
        // Also read-only — unlike read_repo_content, this needs zero GitHub
        // calls at all: the real file content AI Developer wrote is already
        // sitting in the originating github_open_pr event's own `result`
        // field. This just surfaces AI Developer's own real record of past
        // work (what it wrote, why it was asked) instead of a fresh fetch.
        actionKey: "explain_dev_work",
        label: "Explain past dev work",
        riskCategory: "read_only",
        defaultMode: "autonomous",
        adjustable: false,
        approverRule: "founder",
      },
    ],
  },
];

/**
 * Ensures every core agent definition exists for this founder, creating
 * whatever's missing. Only ever creates — never overwrites an existing
 * Agent's mutable fields (status, etc.), so this is safe to call on every
 * page load that needs the roster, not just once at signup.
 */
export async function ensureCoreAgentsSeeded(founderId) {
  for (const def of CORE_AGENT_DEFINITIONS) {
    let agent = await Agent.findOne({ founderId, agentKey: def.agentKey });
    if (!agent) {
      // Callers (getAgents/getActionTypes/getAutonomySettings) run in
      // parallel from the client, so two requests can both see "missing" at
      // once. Agent has a unique index on {founderId, agentKey} — treat a
      // duplicate-key error as "someone else just created it," not a failure.
      try {
        agent = await Agent.create({
          founderId,
          agentKey: def.agentKey,
          name: def.name,
          role: def.role,
          capabilities: def.capabilities,
          status: "idle",
          model: def.model,
        });
      } catch (err) {
        if (err?.code !== 11000) throw err;
        agent = await Agent.findOne({ founderId, agentKey: def.agentKey });
      }
    }
    for (const at of def.actionTypes) {
      const exists = await ActionType.findOne({ agentId: agent._id, actionKey: at.actionKey });
      if (!exists) {
        try {
          await ActionType.create({ agentId: agent._id, ...at });
        } catch (err) {
          if (err?.code !== 11000) throw err;
        }
      }
    }
  }
}
