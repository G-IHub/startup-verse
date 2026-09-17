import mongoose from "mongoose";

const scheduledEmailSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agentEventId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentEvent", default: null },
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Integration", default: null },
    recipientEmail: { type: String, required: true },
    recipientName: { type: String, default: "" },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    scheduledFor: { type: Date, default: null }, // null = send immediately
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    sentAt: { type: Date, default: null },
    errorMessage: { type: String, default: "" },
    sequenceIndex: { type: Number, default: 0 }, // 0 for single emails, 1+ for sequence steps
    sequenceId: { type: String, default: null }, // groups emails in the same sequence
  },
  { timestamps: true },
);

scheduledEmailSchema.index({ founderId: 1, status: 1 });
scheduledEmailSchema.index({ sequenceId: 1, sequenceIndex: 1 });

export default mongoose.model("ScheduledEmail", scheduledEmailSchema);
