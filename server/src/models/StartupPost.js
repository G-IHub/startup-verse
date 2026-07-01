import mongoose from "mongoose";
import {
  STARTUP_POST_STAGES,
  STARTUP_POST_COMMITMENTS,
  STARTUP_POST_COMPENSATION_PHILOSOPHIES,
  STARTUP_POST_VISIBILITIES,
} from "../utils/enums.js";

const offerSchema = new mongoose.Schema(
  {
    compensationPhilosophy: {
      type: String,
      enum: {
        values: [...STARTUP_POST_COMPENSATION_PHILOSOPHIES, ""],
        message: "{VALUE} is not a valid compensation philosophy",
      },
      default: "",
    },
    equityMin: {
      type: String,
      default: "",
      maxlength: [10, "equityMin cannot exceed 10 characters"],
    },
    equityMax: {
      type: String,
      default: "",
      maxlength: [10, "equityMax cannot exceed 10 characters"],
    },
    salaryMin: {
      type: String,
      default: "",
      maxlength: [20, "salaryMin cannot exceed 20 characters"],
    },
    salaryMax: {
      type: String,
      default: "",
      maxlength: [20, "salaryMax cannot exceed 20 characters"],
    },
    currency: {
      type: String,
      default: "",
      maxlength: [10, "currency cannot exceed 10 characters"],
    },
    compensationCountry: {
      type: String,
      default: "",
      maxlength: [3, "compensationCountry cannot exceed 3 characters"],
    },
    notes: {
      type: String,
      default: "",
      maxlength: [500, "Offer notes cannot exceed 500 characters"],
    },
  },
  { _id: false },
);

const startupPostSchema = new mongoose.Schema(
  {
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "founderId is required"],
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      default: null,
      index: true,
    },

    // Structured opportunity fields (populated from founder ideaData)
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    founderName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Founder name cannot exceed 200 characters"],
    },
    industry: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Industry cannot exceed 100 characters"],
    },
    stage: {
      type: String,
      enum: {
        values: [...STARTUP_POST_STAGES, ""],
        message: "{VALUE} is not a valid stage",
      },
      default: "",
    },
    funding: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Funding cannot exceed 100 characters"],
    },
    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    commitment: {
      type: String,
      enum: {
        values: [...STARTUP_POST_COMMITMENTS, ""],
        message: "{VALUE} is not a valid commitment type",
      },
      default: "",
    },
    teamSize: {
      type: Number,
      default: 0,
      min: [0, "Team size cannot be negative"],
      max: [10000, "Team size cannot exceed 10000"],
    },
    lookingFor: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((v) => typeof v === "string" && v.length <= 100),
        message: "Each role in lookingFor cannot exceed 100 characters",
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20 && arr.every((v) => typeof v === "string" && v.length <= 50),
        message: "Maximum 20 tags, each up to 50 characters",
      },
    },
    offer: { type: offerSchema, default: null },
    interested: {
      type: Number,
      default: 0,
      min: [0, "Interested count cannot be negative"],
    },
    postedDate: { type: Date, default: null },

    // Additional founder-supplied links
    website: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Website URL cannot exceed 1000 characters"],
    },
    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "LinkedIn URL cannot exceed 1000 characters"],
    },
    githubUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "GitHub URL cannot exceed 1000 characters"],
    },
    contactEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: [200, "Contact email cannot exceed 200 characters"],
    },
    pitchDeckUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Pitch deck URL cannot exceed 1000 characters"],
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Logo URL cannot exceed 1000 characters"],
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
      maxlength: [160, "Tagline cannot exceed 160 characters"],
    },
    brandColor: {
      type: String,
      default: "",
      trim: true,
      maxlength: [7, "Brand color must be a hex value"],
    },
    twitterUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Twitter URL cannot exceed 1000 characters"],
    },

    // Legacy / fallback plain-text or JSON blob
    content: {
      type: String,
      default: "",
      maxlength: [20000, "Content cannot exceed 20000 characters"],
    },
    visibility: {
      type: String,
      enum: {
        values: STARTUP_POST_VISIBILITIES,
        message: "{VALUE} is not a valid visibility setting",
      },
      default: "public",
    },
  },
  { timestamps: true },
);

startupPostSchema.index({ founderId: 1, createdAt: -1 });

const StartupPost =
  mongoose.models.StartupPost ||
  mongoose.model("StartupPost", startupPostSchema);

export default StartupPost;
