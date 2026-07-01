import mongoose from "mongoose";

const workExperienceSchema = new mongoose.Schema({
  company: { type: String, default: "" },
  position: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  current: { type: Boolean, default: false },
  description: { type: String, default: "" },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  degree: { type: String, default: "" },
  field: { type: String, default: "" },
  startYear: { type: String, default: "" },
  endYear: { type: String, default: "" },
  current: { type: Boolean, default: false },
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  issuer: { type: String, default: "" },
  year: { type: String, default: "" },
  url: { type: String, default: "" },
}, { _id: false });

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  url: { type: String, default: "" },
  type: { type: String, default: "" },
}, { _id: false });

const talentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Identity
    fullName: { type: String, default: "", maxlength: [100, "Name cannot exceed 100 characters"] },
    professionalTitle: { type: String, default: "", maxlength: [200, "Title cannot exceed 200 characters"] },
    headline: { type: String, default: "", maxlength: [200, "Headline cannot exceed 200 characters"] },
    location: { type: String, default: "", maxlength: [200, "Location cannot exceed 200 characters"] },

    // Profile narrative
    bio: { type: String, default: "", maxlength: [2000, "Bio cannot exceed 2000 characters"] },
    professionalGoals: { type: String, default: "", maxlength: [2000, "Goals cannot exceed 2000 characters"] },

    // Skills and experience
    skills: {
      type: [String],
      default: [],
      validate: [v => v.every(s => s.length <= 100), "Skill strings cannot exceed 100 characters"],
    },
    yearsOfExperience: { type: String, default: "" },

    // Availability
    availability: { type: String, default: "open", maxlength: [50, "Availability cannot exceed 50 characters"] },
    availabilityStatus: { type: String, default: "" },
    preferredCommitment: { type: String, default: "" },

    // Links
    linkedinUrl: { type: String, default: "", maxlength: [1000, "URL cannot exceed 1000 characters"] },
    githubUrl: { type: String, default: "", maxlength: [1000, "URL cannot exceed 1000 characters"] },
    websiteUrl: { type: String, default: "", maxlength: [1000, "URL cannot exceed 1000 characters"] },
    portfolioLinks: { type: [String], default: [] },

    // Preferences
    preferredRoles: { type: [String], default: [] },
    industryPreferences: { type: [String], default: [] },
    interests: { type: [String], default: [] },

    // Structured history
    workExperiences: { type: [workExperienceSchema], default: [] },
    educationList: { type: [educationSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    portfolioItems: { type: [portfolioItemSchema], default: [] },

    // Stored CV reference (optional)
    resumeUrl: { type: String, default: "", maxlength: [1000, "URL cannot exceed 1000 characters"] },
    resumeKey: { type: String, default: "", maxlength: [500, "Key cannot exceed 500 characters"] },
    resumeFileName: { type: String, default: "", maxlength: [255, "Filename cannot exceed 255 characters"] },
    resumeParsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

talentProfileSchema.index({ skills: 1 });
talentProfileSchema.index({ availabilityStatus: 1 });

const TalentProfile =
  mongoose.models.TalentProfile ||
  mongoose.model("TalentProfile", talentProfileSchema);

export default TalentProfile;
