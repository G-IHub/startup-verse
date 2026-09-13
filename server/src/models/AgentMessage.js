import mongoose from "mongoose";

/**
 * AgentMessage — one turn of a real conversation between a founder and an
 * AI Staff agent (docs/ai-agent-roadmap.md Phase 3). Separate from the
 * existing `Message` model on purpose: that one is strictly human-to-human
 * (fromUserId/toUserId, both real Users) with no group/room concept, and
 * forcing an agent into that shape would mean faking a User document for
 * every agent. This model is scoped to (founderId, agentId) instead — one
 * continuous thread per founder per agent, matching how the Chat UI's
 * agent-switcher already presents it.
 */
const agentMessageSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    role: { type: String, enum: ["founder", "agent"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    // Set only on an "agent" message that resulted in a real proposed action,
    // so the UI can show "proposed — check X". `proposedEventKind` tells the
    // UI which real action this was (a sprint plan vs. a hand-off to AI
    // Developer), since each links somewhere different.
    proposedEventId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentEvent", default: null },
    proposedEventKind: { type: String, enum: ["sprint_plan", "build_task", null], default: null },
  },
  { timestamps: true },
);

agentMessageSchema.index({ founderId: 1, agentId: 1, createdAt: 1 });

const AgentMessage = mongoose.models.AgentMessage || mongoose.model("AgentMessage", agentMessageSchema);

export default AgentMessage;
