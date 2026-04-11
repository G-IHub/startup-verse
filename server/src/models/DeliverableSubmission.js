import mongoose from "mongoose";

const deliverableSubmissionSchema = new mongoose.Schema(
  {
    deliverableId: { type: mongoose.Schema.Types.ObjectId, ref: "Deliverable", required: true, index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
    content: { 
      type: String, 
      default: "",
      maxlength: [10000, "Content cannot exceed 10000 characters"]
    },
    links: { type: [String], default: [] },
    status: { 
      type: String, 
      default: "submitted",
      maxlength: [50, "Status cannot exceed 50 characters"]
    },
    review: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

deliverableSubmissionSchema.index({ deliverableId: 1, founderId: 1 }, { unique: true });

const DeliverableSubmission =
  mongoose.models.DeliverableSubmission ||
  mongoose.model("DeliverableSubmission", deliverableSubmissionSchema);

export default DeliverableSubmission;