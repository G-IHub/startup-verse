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
  },
  { timestamps: true },
);

weeklyOutcomeSchema.index({ founderId: 1, weekOf: -1 });

const WeeklyOutcome =
  mongoose.models.WeeklyOutcome ||
  mongoose.model("WeeklyOutcome", weeklyOutcomeSchema);

export default WeeklyOutcome;
