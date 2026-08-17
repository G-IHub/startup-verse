import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Image URL cannot exceed 2000 characters"],
    },
    name: { type: String, default: "", trim: true, maxlength: 300 },
    mimeType: { type: String, default: "", trim: true, maxlength: 200 },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const workLogSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: [true, "startupId is required"],
      index: true,
    },
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "founderId is required"],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "authorId is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [2, "Description must be at least 2 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    image: { type: imageSchema, default: null },
    linkUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Link URL cannot exceed 2000 characters"],
    },
  },
  { timestamps: true },
);

workLogSchema.index({ startupId: 1, createdAt: -1 });
workLogSchema.index({ authorId: 1, createdAt: -1 });
workLogSchema.index({ founderId: 1, createdAt: -1 });

const WorkLog =
  mongoose.models.WorkLog || mongoose.model("WorkLog", workLogSchema);

export default WorkLog;
