import mongoose from "mongoose";

const mentorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    expertise: { type: [String], default: [] },
    assignedFounders: { type: [String], default: [] },
    /** Per-mentor magic-link token used by the mentor onboarding flow. */
    token: { type: String, index: true, sparse: true, unique: false },
    tokenIssuedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

mentorProfileSchema.index({ organizationId: 1, createdAt: -1 });

const MentorProfile =
  mongoose.models.MentorProfile || mongoose.model("MentorProfile", mentorProfileSchema);

export default MentorProfile;