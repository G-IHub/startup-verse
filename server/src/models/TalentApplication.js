import mongoose from "mongoose";

const talentApplicationSchema = new mongoose.Schema(
  {
    talentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      index: true,
    },
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    position: { 
      type: String, 
      default: "",
      maxlength: [100, "Position cannot exceed 100 characters"]
    },
    coverNote: { 
      type: String, 
      default: "",
      maxlength: [2000, "Cover note cannot exceed 2000 characters"]
    },
    status: { 
      type: String, 
      default: "submitted", 
      index: true,
      maxlength: [50, "Status string cannot exceed 50 characters"]
    },
  },
  { timestamps: true },
);

talentApplicationSchema.index({ talentId: 1, createdAt: -1 });

const TalentApplication =
  mongoose.models.TalentApplication ||
  mongoose.model("TalentApplication", talentApplicationSchema);

export default TalentApplication;
