import mongoose from "mongoose";

const startupSchema = new mongoose.Schema(
  {
    founderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "founderId is required"], 
      unique: true 
    },
    name: { 
      type: String, 
      required: [true, "Startup name is required"], 
      trim: true,
      minlength: [2, "Startup name must be at least 2 characters"],
      maxlength: [100, "Startup name cannot exceed 100 characters"]
    },
    description: { 
      type: String, 
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    industry: { 
      type: String, 
      default: "",
      maxlength: [100, "Industry cannot exceed 100 characters"]
    },
    stage: { 
      type: String, 
      default: "",
      maxlength: [50, "Stage cannot exceed 50 characters"]
    },
    website: { 
      type: String, 
      default: "",
      maxlength: [1000, "Website URL cannot exceed 1000 characters"]
    },
    logo: { 
      type: String, 
      default: "",
      maxlength: [1000, "Logo URL cannot exceed 1000 characters"]
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    // The real repo AI Developer builds into for this startup, so AI PM's
    // automatic build-task hand-offs (orchestrator.service.js's
    // advanceBuildQueueIfIdle) know where to open a PR without asking the
    // founder every time. Set from the Integrations page's GitHub card, or
    // by AI PM itself the first time a founder names a repo in chat.
    defaultGithubRepo: {
      owner: { type: String, default: "", trim: true, maxlength: 200 },
      repo: { type: String, default: "", trim: true, maxlength: 200 },
    },
    // Opt-in for AI PM's autonomous continuous-planning check-in
    // (2026-09-14) — off by default. When true, the moment AI Developer's
    // build queue empties, AI PM drafts more tasks (or, if the current
    // week's goal has actually run its course, a whole new plan) on its
    // own and proposes it for real approval, without the founder having to
    // ask first. This is the first behavior anywhere in this app that acts
    // without being asked, so it stays opt-in rather than on for everyone.
    autonomousPlanningEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

startupSchema.index({ founderId: 1 }, { unique: true });
startupSchema.index({ industry: 1, stage: 1 });

const Startup = mongoose.models.Startup || mongoose.model("Startup", startupSchema);

export default Startup;