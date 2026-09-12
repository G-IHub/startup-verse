import mongoose from "mongoose";

// A lightweight wrapper so multiple AgentEvents (opened -> reviewed -> merged
// -> deployed) can be grouped as one visible thread. Schema-only in Phase 0
// per docs/ai-agent-roadmap.md — the Workroom's coordination feed renders
// directly from AgentEvent.parentEventId chains for now; deeper Task
// grouping is deferred until a real multi-step agent (AI Developer) needs it.
// Named AgentTask (not "Task") to avoid colliding with the existing
// execution-engine Task model.
const agentTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 300 },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", default: null },
    status: {
      type: String,
      enum: { values: ["open", "blocked", "done"], message: "{VALUE} is not a valid task status" },
      default: "open",
    },
    currentOwner: { type: String, default: "" }, // Agent._id or User._id as a string
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", default: null },
  },
  { timestamps: true },
);

const AgentTask = mongoose.models.AgentTask || mongoose.model("AgentTask", agentTaskSchema);

export default AgentTask;
