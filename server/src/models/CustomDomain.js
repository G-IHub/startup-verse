/**
 * CustomDomain.js — real custom-domain feature (2026-09-15), Part 3 of the
 * "hosted link -> live data -> custom domains" plan. One real domain per
 * startup, provisioned through Railway's real GraphQL API (see
 * railwayAdapter.js) so a founder can point their own domain (already
 * purchased elsewhere — DNS is theirs, not ours) at their StartupVerse
 * hosted product instead of the sites.startupverse.space/{slug} link.
 */
import mongoose from "mongoose";

const customDomainSchema = new mongoose.Schema(
  {
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true, unique: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // Railway's own id for this domain resource — needed to query/delete it
    // later without re-creating it.
    railwayDomainId: { type: String, default: "" },
    // Real DNS instructions a founder must add at their own registrar —
    // Railway generates these, we only display and track them.
    cnameTarget: { type: String, default: "" },
    verificationToken: { type: String, default: "" },
    // "pending" until Railway reports the cert as issued (verified DNS),
    // "issued" once real, "failed" if Railway reports a real failure.
    certificateStatus: { type: String, enum: ["pending", "issued", "failed"], default: "pending" },
  },
  { timestamps: true },
);

const CustomDomain = mongoose.models.CustomDomain || mongoose.model("CustomDomain", customDomainSchema);

export default CustomDomain;
