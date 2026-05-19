import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["general", "template", "guide", "video", "tool", "article"],
      default: "general",
      index: true,
    },
    url: { type: String, default: "" },
    type: {
      type: String,
      enum: ["link", "document", "video", "article", "tool", "template", "other"],
      default: "other",
      index: true,
    },
    stageId: { type: Number, index: true },
    youtubeId: { type: String, default: "" },
    source: { type: String, default: "" },
    duration: { type: String, default: "" },
    recommended: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

resourceSchema.index({ cohortId: 1, createdAt: -1 });
resourceSchema.index({ type: 1, stageId: 1 });
resourceSchema.index({ cohortId: 1, category: 1, type: 1 });
resourceSchema.index({ title: "text", description: "text", tags: "text" });

const Resource = mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

export default Resource;