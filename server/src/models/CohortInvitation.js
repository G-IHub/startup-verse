import mongoose from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Blueprint §6.10 / §13:
 *
 * Token-based invitation mechanism for an Organisation to invite a Founder
 * into a Cohort. Distinct from `FounderTalentInvitation` which is the
 * Founder→Talent recruiting channel.
 */
const cohortInvitationSchema = new mongoose.Schema(
  {
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
      required: [true, "cohortId is required"],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          return v === "" || emailRegex.test(v);
        },
        message: "Please provide a valid email address",
      },
    },
    message: {
      type: String,
      default: "",
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    token: {
      type: String,
      required: [true, "token is required"],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "declined", "expired", "cancelled"],
        message: "{VALUE} is not a valid cohort invitation status",
      },
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    respondedAt: { type: Date, default: null },
    lastSentAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

cohortInvitationSchema.index({ cohortId: 1, founderId: 1 });
cohortInvitationSchema.index({ status: 1, expiresAt: 1 });

const CohortInvitation =
  mongoose.models.CohortInvitation ||
  mongoose.model("CohortInvitation", cohortInvitationSchema);

export default CohortInvitation;
