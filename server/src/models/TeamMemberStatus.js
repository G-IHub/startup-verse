import mongoose from "mongoose";

const teamMemberStatusSchema = new mongoose.Schema(
  {
    teamMemberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "teamMemberId is required"], index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
    status: { 
      type: String, 
      default: "available",
      maxlength: [50, "Status string cannot exceed 50 characters"]
    },
    note: { 
      type: String, 
      default: "",
      maxlength: [1000, "Note cannot exceed 1000 characters"]
    },
  },
  { timestamps: true },
);

teamMemberStatusSchema.index({ teamMemberId: 1, createdAt: -1 });

const TeamMemberStatus =
  mongoose.models.TeamMemberStatus ||
  mongoose.model("TeamMemberStatus", teamMemberStatusSchema);

export default TeamMemberStatus;