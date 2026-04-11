import mongoose from "mongoose";

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
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true },
);

deliverableSchema.index({ cohortId: 1, dueDate: 1 });

const Deliverable = mongoose.models.Deliverable || mongoose.model("Deliverable", deliverableSchema);

export default Deliverable;