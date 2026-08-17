import mongoose from "mongoose";

const programJoinRequestSchema = new mongoose.Schema(
  {
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
      required: true,
      index: true,
    },
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      index: true,
    },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

programJoinRequestSchema.index(
  { startupId: 1, cohortId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

const ProgramJoinRequest =
  mongoose.models.ProgramJoinRequest ||
  mongoose.model("ProgramJoinRequest", programJoinRequestSchema);

export default ProgramJoinRequest;
