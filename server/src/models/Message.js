import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: { type: String, required: true },
    subject: { type: String, default: "", maxlength: 250 },
    messageType: {
      type: String,
      enum: ["dm", "announcement", "bulk", "individual"],
      default: "dm",
      index: true,
    },
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
      index: true,
    },
    attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    readAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

messageSchema.index({
  startupId: 1,
  fromUserId: 1,
  toUserId: 1,
  createdAt: -1,
});

messageSchema.index({ organizationId: 1, createdAt: -1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
