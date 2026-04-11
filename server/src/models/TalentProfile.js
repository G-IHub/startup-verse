import mongoose from "mongoose";

const talentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: { 
      type: String, 
      default: "",
      maxlength: [200, "Headline cannot exceed 200 characters"]
    },
    bio: { 
      type: String, 
      default: "",
      maxlength: [2000, "Bio cannot exceed 2000 characters"]
    },
    skills: { 
      type: [String], 
      default: [],
      validate: [v => v.every(s => s.length <= 100), "Skill strings cannot exceed 100 characters"]
    },
    availability: { 
      type: String, 
      default: "open",
      maxlength: [50, "Availability cannot exceed 50 characters"]
    },
    portfolioLinks: { type: [String], default: [] },
  },
  { timestamps: true },
);

talentProfileSchema.index({ skills: 1 });

const TalentProfile =
  mongoose.models.TalentProfile ||
  mongoose.model("TalentProfile", talentProfileSchema);

export default TalentProfile;
