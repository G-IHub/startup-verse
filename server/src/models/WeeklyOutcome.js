import mongoose from "mongoose";
import { WEEKLY_OUTCOME_STATUSES } from "../utils/enums.js";

const weeklyOutcomeSchema = new mongoose.Schema(
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
      required: [true, "startupId is required"],
      index: true,
    },
    weekOf: {
      type: Date,
      required: [true, "weekOf boundary is required"],
      index: true,
    },
    goal: {
      type: String,
      required: [true, "Goal is required"],
      maxlength: [5000, "Goal cannot exceed 5000 characters"],
    },
    summary: {
      type: String,
      default: "",
      maxlength: [5000, "Summary cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: WEEKLY_OUTCOME_STATUSES,
        message: "{VALUE} is not a valid weekly outcome status",
      },
      default: "active",
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be less than 0"],
      max: [100, "Score cannot exceed 100"],
    },
    weekNumber: {
      type: Number,
      default: undefined,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: [0, "completionPercentage cannot be less than 0"],
      max: [100, "completionPercentage cannot exceed 100"],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionData: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true },
);

weeklyOutcomeSchema.index({ founderId: 1, weekOf: -1 });

const FINAL_OUTCOME_STATUSES = new Set(["completed", "partial", "missed"]);

// Mongoose 9+: pre middleware does not receive next(); throw instead.
weeklyOutcomeSchema.pre("save", async function rejectFinalOutcomeMutation() {
  if (this.isNew) return;
  const existing = await this.constructor
    .findById(this._id)
    .select("status")
    .lean();
  if (existing && FINAL_OUTCOME_STATUSES.has(existing.status)) {
    throw new Error(
      "WeeklyOutcome is immutable once submitted (completed, partial, or missed).",
    );
  }
});

weeklyOutcomeSchema.pre(
  "findOneAndUpdate",
  async function guardImmutableUpdate() {
    const filter = this.getFilter();
    const existing = await this.model.findOne(filter).lean();
    if (existing && FINAL_OUTCOME_STATUSES.has(existing.status)) {
      throw new Error(
        "WeeklyOutcome is immutable once submitted (completed, partial, or missed).",
      );
    }
  },
);

weeklyOutcomeSchema.pre("updateOne", async function guardImmutableUpdateOne() {
  const filter = this.getFilter();
  const existing = await this.model.findOne(filter).lean();
  if (existing && FINAL_OUTCOME_STATUSES.has(existing.status)) {
    throw new Error(
      "WeeklyOutcome is immutable once submitted (completed, partial, or missed).",
    );
  }
});

const WeeklyOutcome =
  mongoose.models.WeeklyOutcome ||
  mongoose.model("WeeklyOutcome", weeklyOutcomeSchema);

export default WeeklyOutcome;
