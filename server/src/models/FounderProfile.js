import mongoose from "mongoose";

const founderProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "userId is required"], unique: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: [true, "startupId is required"], index: true },
    bio: { 
      type: String, 
      default: "",
      maxlength: [2000, "Bio cannot exceed 2000 characters"]
    },
    background: { 
      type: String, 
      default: "",
      maxlength: [5000, "Background cannot exceed 5000 characters"]
    },
    links: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const FounderProfile =
  mongoose.models.FounderProfile || mongoose.model("FounderProfile", founderProfileSchema);

export default FounderProfile;