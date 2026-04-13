import mongoose from "mongoose";

const reminderJobSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "dead"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 8 },
    nextRunAt: { type: Date, required: true, index: true },
    lastError: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reminderJobSchema.index({ status: 1, nextRunAt: 1 });

const ReminderJob =
  mongoose.models.ReminderJob || mongoose.model("ReminderJob", reminderJobSchema);

export default ReminderJob;
