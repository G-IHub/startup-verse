import mongoose from "mongoose";

const cohortSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { 
      type: String, 
      required: [true, "Cohort name is required"], 
      trim: true,
      minlength: [2, "Cohort name must be at least 2 characters"],
      maxlength: [100, "Cohort name cannot exceed 100 characters"]
    },
    description: { 
      type: String, 
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { 
      type: String, 
      default: "active",
      maxlength: [50, "Status cannot exceed 50 characters"]
    },
    // Soft-delete marker. Cleared on restore; populated by Step 2.3's
    // soft-delete handler. All "active" cohort read sites filter
    // `{ deletedAt: null }`; display-only sites (e.g. submission lists)
    // intentionally do not, so historical references keep rendering names.
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

cohortSchema.index({ organizationId: 1, createdAt: -1 });

const Cohort = mongoose.models.Cohort || mongoose.model("Cohort", cohortSchema);

export default Cohort;