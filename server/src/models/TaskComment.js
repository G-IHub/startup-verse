import mongoose from "mongoose";

const taskCommentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "taskId is required"],
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: [true, "startupId is required"],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "authorId is required"],
    },
    body: {
      type: String,
      required: [true, "Comment body is required"],
      trim: true,
      minlength: [1, "Comment body is required"],
      maxlength: [5000, "Comment cannot exceed 5000 characters"],
    },
  },
  { timestamps: true },
);

taskCommentSchema.index({ taskId: 1, createdAt: 1 });

const TaskComment =
  mongoose.models.TaskComment || mongoose.model("TaskComment", taskCommentSchema);

export default TaskComment;
