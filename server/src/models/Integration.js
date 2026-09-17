import mongoose from "mongoose";

/**
 * Stores an integration connection for a founder.
 * Credentials are kept server-side only — never sent to the client in plain text.
 * The client receives only { type, status, connectedAt, lastUsedAt, meta }.
 */
const integrationSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["gmail", "whatsapp", "google_calendar", "stripe", "linkedin", "instagram", "facebook", "sendgrid"],
    },
    status: { type: String, enum: ["connected", "disconnected", "error"], default: "connected" },
    // Credentials stored as a sub-document — intentionally not indexed or exposed
    credentials: {
      email: { type: String, default: "" },          // gmail: the sender address
      appPassword: { type: String, default: "" },    // gmail: 16-char app password
      apiKey: { type: String, default: "" },         // sendgrid / other API-key services
      accessToken: { type: String, default: "" },    // oauth: access token
      refreshToken: { type: String, default: "" },   // oauth: refresh token
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { displayName, accountId }
    connectedAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: null },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true },
);

integrationSchema.index({ founderId: 1, type: 1 }, { unique: true });

export default mongoose.model("Integration", integrationSchema);
