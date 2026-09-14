/**
 * FormSubmission.js — real data capture (2026-09-15) for forms embedded in
 * a startup's real hosted page (see HostedSite.js/hostedSiteService.js).
 * A founder asked directly: "can we make it that users and AI staff can
 * view real live data, form fields, subscribers, emails, names, etc." —
 * before this, AI Developer's forms posted to nowhere real (a dead
 * fetch() call, per this session's own earlier finding). Submitted via
 * the public POST /:slug/submit route (hostedSitePublic.js), no auth
 * (same as the hosted page itself), read back only via the founder-scoped
 * GET endpoint (formSubmissions.controller.js).
 */
import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema(
  {
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

formSubmissionSchema.index({ founderId: 1, createdAt: -1 });

const FormSubmission = mongoose.models.FormSubmission || mongoose.model("FormSubmission", formSubmissionSchema);

export default FormSubmission;
