import mongoose from "mongoose";

const cohortMembershipSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true, index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "founderId is required"], index: true },
    status: { 
      type: String, 
      default: "active",
      maxlength: [50, "Status cannot exceed 50 characters"]
    },
    joinedAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
);

cohortMembershipSchema.index({ cohortId: 1, startupId: 1 }, { unique: true });

const CohortMembership =
  mongoose.models.CohortMembership || mongoose.model("CohortMembership", cohortMembershipSchema);

export default CohortMembership;