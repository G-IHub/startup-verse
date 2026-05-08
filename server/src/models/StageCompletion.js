import mongoose from "mongoose";

const stageCompletionSchema = new mongoose.Schema(
  {
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "founderId is required"],
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      index: true,
    },
    stageId: {
      type: Number,
      required: [true, "stageId is required"],
      min: 1,
      max: 6,
    },
    stageName: {
      type: String,
      default: "",
      maxlength: [100, "stageName cannot exceed 100 characters"],
    },
    method: {
      type: String,
      enum: ["completed", "skipped"],
      default: "completed",
    },
    tasksCompletedCount: { type: Number, default: 0, min: 0 },
    tasksTotal: { type: Number, default: 0, min: 0 },
    durationDays: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

stageCompletionSchema.index({ founderId: 1, stageId: 1 });
stageCompletionSchema.index({ founderId: 1, completedAt: -1 });

const StageCompletion =
  mongoose.models.StageCompletion ||
  mongoose.model("StageCompletion", stageCompletionSchema);

export default StageCompletion;
