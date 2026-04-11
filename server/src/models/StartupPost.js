import mongoose from "mongoose";

const startupPostSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true, index: true },
    content: { type: String, required: true },
    visibility: { type: String, default: "team" },
  },
  { timestamps: true },
);

startupPostSchema.index({ founderId: 1, createdAt: -1 });

const StartupPost = mongoose.models.StartupPost || mongoose.model("StartupPost", startupPostSchema);

export default StartupPost;