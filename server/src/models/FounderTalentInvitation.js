import mongoose from "mongoose";
import { INVITATION_STATUSES } from "../utils/enums.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const founderTalentInvitationSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    talentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
    email: { 
      type: String, 
      lowercase: true, 
      trim: true, 
      default: "",
      validate: {
        validator: function(v) { return v === "" || emailRegex.test(v); },
        message: "Please provide a valid email address"
      }
    },
    message: { 
      type: String, 
      default: "",
      maxlength: [2000, "Message cannot exceed 2000 characters"]
    },
    token: { type: String, index: true },
    status: { 
      type: String, 
      enum: {
        values: INVITATION_STATUSES,
        message: "{VALUE} is not a valid status"
      },
      default: "pending", 
      index: true 
    },
    kind: { type: String, default: "founder-talent" },
    onboarded: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

founderTalentInvitationSchema.index({ founderId: 1, status: 1, createdAt: -1 });

const FounderTalentInvitation =
  mongoose.models.FounderTalentInvitation ||
  mongoose.model("FounderTalentInvitation", founderTalentInvitationSchema);

export default FounderTalentInvitation;