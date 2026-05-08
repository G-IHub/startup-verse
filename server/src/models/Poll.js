import mongoose from "mongoose";

const pollOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: [String], default: [] },
  },
  { _id: false },
);

const pollSchema = new mongoose.Schema(
  {
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    question: { type: String, required: true },
    description: { type: String, default: "" },
    options: { type: [pollOptionSchema], required: true },
    allowMultiple: { type: Boolean, default: false },
    anonymous: { type: Boolean, default: false },
    endsAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "closed"], default: "active", index: true },
    createdBy: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

pollSchema.index({ founderId: 1, createdAt: -1 });
pollSchema.index({ startupId: 1, createdAt: -1 });

const Poll = mongoose.models.Poll || mongoose.model("Poll", pollSchema);

export default Poll;
