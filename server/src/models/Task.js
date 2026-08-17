import mongoose from "mongoose";
import { TASK_STATUSES, TASK_PRIORITIES } from "../utils/enums.js";

const taskSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "founderId is required"], index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: [true, "startupId is required"], index: true },
    title: { 
      type: String, 
      required: [true, "Task title is required"], 
      trim: true,
      minlength: [2, "Task title must be at least 2 characters"],
      maxlength: [200, "Task title cannot exceed 200 characters"]
    },
    description: { 
      type: String, 
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"]
    },
    status: { 
      type: String, 
      enum: {
        values: TASK_STATUSES,
        message: "{VALUE} is not a valid task status"
      },
      default: "pending", 
      index: true 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    assignedToName: { type: String, default: "", trim: true, maxlength: 200 },
    assignedToAvatar: { type: String, default: "", trim: true, maxlength: 2000 },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", index: true },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: "{VALUE} is not a valid task priority",
      },
      default: "medium",
      index: true,
    },
    comments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    links: {
      type: [
        {
          url: {
            type: String,
            required: true,
            trim: true,
            maxlength: [2000, "Link URL cannot exceed 2000 characters"],
          },
          label: {
            type: String,
            default: "",
            trim: true,
            maxlength: [200, "Link label cannot exceed 200 characters"],
          },
        },
      ],
      default: [],
    },
    attachments: {
      type: [
        {
          url: {
            type: String,
            required: true,
            trim: true,
            maxlength: [2000, "Attachment URL cannot exceed 2000 characters"],
          },
          name: { type: String, default: "", trim: true, maxlength: 300 },
          mimeType: { type: String, default: "", trim: true, maxlength: 200 },
          size: { type: Number, default: 0 },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    githubIssueId: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "GitHub issue id cannot exceed 200 characters"],
    },
    githubIssueUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "GitHub issue URL cannot exceed 1000 characters"],
    },
    githubRepo: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "GitHub repo cannot exceed 200 characters"],
    },
    incentive: { 
      type: String, 
      default: "",
      maxlength: [1000, "Incentive cannot exceed 1000 characters"]
    },
    actionButton: { 
      type: String, 
      default: "",
      maxlength: [1000, "Action button cannot exceed 1000 characters"]
    },
    blockerReason: { 
      type: String, 
      default: "",
      maxlength: [1000, "Blocker reason cannot exceed 1000 characters"]
    },
    blockerNote: { 
      type: String, 
      default: "",
      maxlength: [1000, "Blocker note cannot exceed 1000 characters"]
    },
  },
  { timestamps: true },
);

taskSchema.index({ founderId: 1, startupId: 1, createdAt: -1 });
taskSchema.index(
  { startupId: 1, githubIssueId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { githubIssueId: { $type: "string", $gt: "" } },
  },
);

// Mongoose 8+ / 9+: document middleware does not pass `next`; throw instead.
taskSchema.pre("validate", function requireBlockerFieldsWhenBlocked() {
  if (this.status === "blocked") {
    const reasonOk =
      typeof this.blockerReason === "string" &&
      this.blockerReason.trim().length > 0;
    const noteOk =
      typeof this.blockerNote === "string" &&
      this.blockerNote.trim().length > 0;
    if (!reasonOk || !noteOk) {
      throw new Error(
        "Blocked tasks require both blockerReason and blockerNote.",
      );
    }
  }
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;