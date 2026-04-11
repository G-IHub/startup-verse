import mongoose from "mongoose";

const presenceSchema = new mongoose.Schema(
  {
    startupId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "" },
    role: { type: String, default: "" },
    isOnline: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

presenceSchema.index({ startupId: 1, userId: 1 }, { unique: true });

const Presence = mongoose.models.Presence || mongoose.model("Presence", presenceSchema);

export default Presence;