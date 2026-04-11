import mongoose from "mongoose";

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
  },
  { timestamps: true },
);

programMilestoneSchema.index({ cohortId: 1, dueDate: 1 });

const ProgramMilestone =
  mongoose.models.ProgramMilestone ||
  mongoose.model("ProgramMilestone", programMilestoneSchema);

export default ProgramMilestone;
