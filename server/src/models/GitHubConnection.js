import mongoose from "mongoose";

const githubConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    githubUserId: { type: String, required: true, trim: true, maxlength: 80 },
    githubLogin: { type: String, required: true, trim: true, maxlength: 80 },
    accessTokenEncrypted: { type: String, required: true },
    scope: { type: String, default: "", maxlength: 500 },
    connectedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const GitHubConnection =
  mongoose.models.GitHubConnection ||
  mongoose.model("GitHubConnection", githubConnectionSchema);

export default GitHubConnection;
