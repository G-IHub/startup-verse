import mongoose from "mongoose";

const presenceSchema = new mongoose.Schema(
  {
    startupId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "" },
    role: { type: String, default: "" },
    isOnline: { type: Boolean, default: true },
    statusText: { type: String, default: "", maxlength: 300 },
    mood: { type: String, default: "", maxlength: 64 },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

presenceSchema.index({ startupId: 1, userId: 1 }, { unique: true });
presenceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Presence = mongoose.models.Presence || mongoose.model("Presence", presenceSchema);

export default Presence;