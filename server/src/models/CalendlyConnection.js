import mongoose from "mongoose";

const calendlyConnectionSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String, default: "" },
    organizationUri: { type: String, default: "" },
    userUri: { type: String, required: true, index: true },
    bookingUrl: { type: String, required: true },
    webhookSubscriptionUri: { type: String, default: "" },
    webhookSigningKeyEncrypted: { type: String, default: "" },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const CalendlyConnection =
  mongoose.models.CalendlyConnection ||
  mongoose.model("CalendlyConnection", calendlyConnectionSchema);

export default CalendlyConnection;
