import mongoose from "mongoose";

// The registry of AI staff for a startup. Phase 0 of docs/ai-agent-roadmap.md —
// no real agent logic calls into this yet; it exists so the orchestrator and
// the AI Staff UI have a real row to point to instead of hardcoded arrays.
const agentSchema = new mongoose.Schema(
  {
    agentKey: { type: String, required: true, trim: true, maxlength: 50 }, // e.g. "agent_dev", "agent_sales"
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 }, // "AI Developer"
    role: { type: String, default: "", maxlength: 100 }, // "Development"
    capabilities: { type: [String], default: [] }, // ["write_code","open_pr","merge_pr"]
    status: {
      type: String,
      enum: { values: ["idle", "working", "blocked"], message: "{VALUE} is not a valid agent status" },
      default: "idle",
    },
    model: { type: String, default: "deepseek" }, // which LLM powers this agent — config, not hardcoded per-agent logic
  },
  { timestamps: true },
);

agentSchema.index({ founderId: 1, agentKey: 1 }, { unique: true });

const Agent = mongoose.models.Agent || mongoose.model("Agent", agentSchema);

export default Agent;
