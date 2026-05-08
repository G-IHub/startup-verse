import mongoose from "mongoose";

const talentWaitlistEntrySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: "", trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

talentWaitlistEntrySchema.index({ email: 1, createdAt: -1 });

const TalentWaitlistEntry =
  mongoose.models.TalentWaitlistEntry ||
  mongoose.model("TalentWaitlistEntry", talentWaitlistEntrySchema);

export default TalentWaitlistEntry;
