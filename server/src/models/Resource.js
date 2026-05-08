import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    type: {
      type: String,
      enum: ["video", "article", "tool", "template", "other"],
      default: "other",
      index: true,
    },
    stageId: { type: Number, index: true },
    youtubeId: { type: String, default: "" },
    source: { type: String, default: "" },
    duration: { type: String, default: "" },
    recommended: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

resourceSchema.index({ cohortId: 1, createdAt: -1 });
resourceSchema.index({ type: 1, stageId: 1 });

const Resource = mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

export default Resource;