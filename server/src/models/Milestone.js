import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "founderId is required"], index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: [true, "startupId is required"], index: true },
    title: { 
      type: String, 
      required: [true, "Milestone title is required"], 
      trim: true,
      minlength: [2, "Milestone title must be at least 2 characters"],
      maxlength: [200, "Milestone title cannot exceed 200 characters"]
    },
    description: { 
      type: String, 
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"]
    },
    dueDate: { type: Date },
    weeklyOutcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeeklyOutcome",
      default: null,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
      default: null,
    },
    sequence: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "blocked"],
      default: "pending",
      index: true,
    },
    totalTasks: { type: Number, default: 0, min: 0 },
    tasksCompleted: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

milestoneSchema.index({ founderId: 1, startupId: 1, sequence: 1 });

const Milestone = mongoose.models.Milestone || mongoose.model("Milestone", milestoneSchema);

export default Milestone;