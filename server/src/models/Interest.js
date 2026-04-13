import mongoose from "mongoose";
import { INTEREST_STATUSES } from "../utils/enums.js";

const interestSchema = new mongoose.Schema(
  {
    talentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
    message: { 
      type: String, 
      default: "",
      maxlength: [2000, "Message cannot exceed 2000 characters"]
    },
    status: { 
      type: String, 
      enum: {
        values: INTEREST_STATUSES,
        message: "{VALUE} is not a valid interest status"
      },
      default: "pending", 
      index: true 
    },
    onboarded: { type: Boolean, default: false, index: true },
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

interestSchema.index({ talentId: 1, founderId: 1, createdAt: -1 });

const Interest = mongoose.models.Interest || mongoose.model("Interest", interestSchema);

export default Interest;