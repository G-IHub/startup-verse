import mongoose from "mongoose";

const replyPreviewSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    senderName: { type: String, default: "" },
    bodySnippet: { type: String, default: "" },
    hasAttachment: { type: Boolean, default: false },
    deletedForEveryone: { type: Boolean, default: false },
  },
  { _id: false },
);

const forwardedFromSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fromUserName: { type: String, default: "" },
    bodySnippet: { type: String, default: "" },
    attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false },
);

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
    body: { type: String, default: "" },
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
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    replyPreview: { type: replyPreviewSchema, default: null },
    forwardedFrom: { type: forwardedFromSchema, default: null },
    hiddenForUserIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    deletedForEveryoneAt: { type: Date, default: null },
    deletedForEveryoneBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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
