import mongoose from "mongoose";

const teamMemberProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "userId is required"], unique: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
    skills: { 
      type: [String], 
      default: [],
      validate: [v => v.every(s => s.length <= 100), "Skill strings cannot exceed 100 characters"]
    },
    bio: { 
      type: String, 
      default: "",
      maxlength: [2000, "Bio cannot exceed 2000 characters"]
    },
  },
  { timestamps: true },
);

const TeamMemberProfile =
  mongoose.models.TeamMemberProfile ||
  mongoose.model("TeamMemberProfile", teamMemberProfileSchema);

export default TeamMemberProfile;