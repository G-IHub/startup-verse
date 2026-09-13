import mongoose from "mongoose";

// The single source of truth (docs/ai-agent-roadmap.md Phase 0). Every other
// AI-Staff view (Approval Queue, Audit Trail, Workroom's coordination feed)
// is a filtered read over this collection, not separately-maintained state.
// Named AgentEvent (not "Event") to avoid colliding with the existing
// calendar/cohort Event model.
const agentEventSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", default: null },

    actorType: {
      type: String,
      enum: { values: ["agent", "human", "system"], message: "{VALUE} is not a valid actor type" },
      required: true,
    },
    actorId: { type: String, required: true }, // Agent._id or User._id, as a string (mixed collections)

    actionTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "ActionType", required: true, index: true },

    targetType: { type: String, required: true, maxlength: 50 }, // "pr", "invoice", "message_batch", "sprint_plan"
    targetId: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Output of a real adapter call (e.g. { prUrl, prNumber, merged: true }), as
    // opposed to `payload` which is the proposal's input. Null until Phase 1's
    // real executors run; Phase 0 events never populate this. On failure, holds
    // { error: "..." } instead — see the "failed" status below.
    result: { type: mongoose.Schema.Types.Mixed, default: null },

    status: {
      type: String,
      enum: {
        values: ["autonomous_completed", "pending_approval", "approved", "declined", "human_completed", "failed"],
        message: "{VALUE} is not a valid event status",
      },
      required: true,
      index: true,
    },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },

    parentEventId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentEvent", default: null }, // the handoff chain
  },
  { timestamps: true },
);

agentEventSchema.index({ founderId: 1, status: 1, createdAt: -1 });
agentEventSchema.index({ founderId: 1, approverId: 1, status: 1 });

const AgentEvent = mongoose.models.AgentEvent || mongoose.model("AgentEvent", agentEventSchema);

export default AgentEvent;
