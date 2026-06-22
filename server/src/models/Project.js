import mongoose from "mongoose";

const { Schema } = mongoose;

const projectMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "member", "viewer"],
      default: "member",
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const githubRepoSchema = new Schema(
  {
    owner: { type: String, default: "" },
    repo: { type: String, default: "" },
    syncEnabled: { type: Boolean, default: false },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    startupId: {
      type: Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      index: true,
    },
    founderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
    },
    description: { type: String, default: "", maxlength: 5000 },
    color: { type: String, default: "#1A56DB" },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "archived"],
      default: "active",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    startupStage: { type: String, default: "" },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    visibility: {
      type: String,
      enum: ["private", "team"],
      default: "team",
    },
    githubRepo: { type: githubRepoSchema, default: () => ({}) },
    members: [projectMemberSchema],
    totalMilestones: { type: Number, default: 0, min: 0 },
    completedMilestones: { type: Number, default: 0, min: 0 },
    totalTasks: { type: Number, default: 0, min: 0 },
    completedTasks: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

projectSchema.index({ startupId: 1, slug: 1 }, { unique: true });
projectSchema.index({ startupId: 1, status: 1 });
projectSchema.index({ founderId: 1, status: 1 });

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
