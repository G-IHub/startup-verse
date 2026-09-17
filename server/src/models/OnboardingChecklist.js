import mongoose from "mongoose";

const checklistTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: true },
);

const onboardingChecklistSchema = new mongoose.Schema(
  {
    teamMemberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", default: null },
    tasks: { type: [checklistTaskSchema], default: [] },
  },
  { timestamps: true },
);

const OnboardingChecklist =
  mongoose.models.OnboardingChecklist ||
  mongoose.model("OnboardingChecklist", onboardingChecklistSchema);

export default OnboardingChecklist;
