import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      required: [true, "Activity type is required"],
      index: true,
      maxlength: [100, "Activity type cannot exceed 100 characters"],
    },
    text: {
      type: String,
      required: [true, "Activity text is required"],
      maxlength: [10000, "Activity text cannot exceed 10000 characters"],
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

activitySchema.index({ startupId: 1, createdAt: -1 });

function rejectMutation(next) {
  next(new Error("Activity records are immutable and cannot be modified or deleted."));
}

activitySchema.pre("updateOne", rejectMutation);
activitySchema.pre("updateMany", rejectMutation);
activitySchema.pre("findOneAndUpdate", rejectMutation);
activitySchema.pre("deleteOne", rejectMutation);
activitySchema.pre("deleteMany", rejectMutation);
activitySchema.pre("findOneAndDelete", rejectMutation);

const Activity =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);

export default Activity;
