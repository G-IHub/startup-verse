import mongoose from "mongoose";

const structuredItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 500 },
    tasks: {
      type: [String],
      default: [],
      validate: [
        (v) => v.every((t) => typeof t === "string" && t.length <= 1000),
        "Task strings cannot exceed 1000 characters",
      ],
    },
    owner: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "blocked"],
      default: "pending",
    },
  },
  { _id: false },
);

const programMilestoneSchema = new mongoose.Schema(
  {
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: Date },
    week: { type: Number, default: null, min: 0 },
    category: {
      type: String,
      enum: [
        "general",
        "deliverable",
        "checkpoint",
        "validation",
        "customer-research",
        "product",
        "marketing",
        "sales",
      ],
      default: "general",
      index: true,
    },
    structuredMilestones: { type: [structuredItemSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

programMilestoneSchema.index({ cohortId: 1, dueDate: 1 });

const ProgramMilestone =
  mongoose.models.ProgramMilestone ||
  mongoose.model("ProgramMilestone", programMilestoneSchema);

export default ProgramMilestone;
