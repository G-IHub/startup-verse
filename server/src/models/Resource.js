import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { timestamps: true },
);

resourceSchema.index({ cohortId: 1, createdAt: -1 });

const Resource = mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

export default Resource;