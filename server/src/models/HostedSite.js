/**
 * HostedSite.js — the real, guaranteed-to-work counterpart to GitHub Pages
 * (2026-09-15). GitHub Pages has hit two real, separate failure modes live
 * this session (a private-repo plan limit, a missing token scope) that are
 * outside this app's control to fix. This model holds the actual latest
 * production HTML for a startup's product, served from our own domain
 * (sites.startupverse.space/{slug}) regardless of the founder's GitHub
 * plan or token permissions — see hostedSiteService.js for how it's kept
 * up to date and hostedSitePublic.js for how it's served.
 */
import mongoose from "mongoose";

const hostedSiteSchema = new mongoose.Schema(
  {
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    html: { type: String, required: true },
    filePath: { type: String, default: "" },
    sourceEventId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentEvent", default: null },
  },
  { timestamps: true },
);

hostedSiteSchema.index({ startupId: 1, filePath: 1 }, { unique: true });
hostedSiteSchema.index({ slug: 1 }, { unique: true });

const HostedSite = mongoose.models.HostedSite || mongoose.model("HostedSite", hostedSiteSchema);

export default HostedSite;
