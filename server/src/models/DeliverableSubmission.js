import mongoose from "mongoose";
import { DELIVERABLE_SUBMISSION_STATUSES } from "../utils/enums.js";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "" },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

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
    attachments: { type: [attachmentSchema], default: [] },
    feedback: {
      type: String,
      default: "",
      maxlength: [8000, "Feedback cannot exceed 8000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: DELIVERABLE_SUBMISSION_STATUSES,
        message: "{VALUE} is not a valid submission status",
      },
      default: "submitted",
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