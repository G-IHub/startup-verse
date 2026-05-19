import mongoose from "mongoose";
import { DELIVERABLE_TYPES } from "../utils/enums.js";

const deliverableSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    title: { 
      type: String, 
      required: [true, "Deliverable title is required"], 
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: { 
      type: String, 
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"]
    },
    type: {
      type: String,
      enum: {
        values: DELIVERABLE_TYPES,
        message: "{VALUE} is not a valid deliverable type",
      },
      default: "general",
    },
    requirements: { type: [String], default: [] },
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    // Step 2.7 soft-archive marker. Archived deliverables are hidden from the
    // default list views but stay queryable via `?includeArchived=1`. Hard
    // delete is blocked when any DeliverableSubmission exists.
    archived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

deliverableSchema.index({ cohortId: 1, dueDate: 1 });
deliverableSchema.index({ title: "text", description: "text" });

const Deliverable = mongoose.models.Deliverable || mongoose.model("Deliverable", deliverableSchema);

export default Deliverable;