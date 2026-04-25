import mongoose from "mongoose";

const learningProgressSchema = new mongoose.Schema(
  {
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "founderId is required"],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: [true, "resourceId is required"],
      index: true,
    },
    stageId: {
      type: Number,
      index: true,
    },
    watchedAt: { type: Date, default: Date.now },
    watchDurationSeconds: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

learningProgressSchema.index({ founderId: 1, resourceId: 1 }, { unique: true });
learningProgressSchema.index({ founderId: 1, stageId: 1 });

const LearningProgress =
  mongoose.models.LearningProgress ||
  mongoose.model("LearningProgress", learningProgressSchema);

export default LearningProgress;
