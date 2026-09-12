import mongoose from "mongoose";

// The permission surface — every distinct thing an agent can do, declared
// once with its FIXED risk category. This is what the orchestrator reads to
// decide whether an action needs approval; the Autonomy Settings UI is a
// thin view over this, not the source of truth (see docs/ai-agent-roadmap.md
// Phase 0/2). `adjustable: false` rows can never be toggled autonomous by
// anyone, including the founder — enforced server-side in the orchestrator,
// not just hidden client-side.
const actionTypeSchema = new mongoose.Schema(
  {
    actionKey: { type: String, required: true, trim: true, maxlength: 50 }, // "send_payment", "write_code"
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    label: { type: String, required: true, maxlength: 150 }, // human-readable, for Autonomy Settings UI
    riskCategory: {
      type: String,
      enum: { values: ["reversible", "sensitive_locked", "read_only"], message: "{VALUE} is not a valid risk category" },
      required: true,
    },
    defaultMode: {
      type: String,
      enum: { values: ["autonomous", "ask_first"], message: "{VALUE} is not a valid mode" },
      default: "ask_first",
    },
    adjustable: { type: Boolean, default: true }, // false for anything sensitive_locked
    approverRule: { type: String, default: "founder" }, // "founder" | "role:marketing" | "role:engineering"
  },
  { timestamps: true },
);

actionTypeSchema.index({ agentId: 1, actionKey: 1 }, { unique: true });

const ActionType = mongoose.models.ActionType || mongoose.model("ActionType", actionTypeSchema);

export default ActionType;
