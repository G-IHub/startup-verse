import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

announcementSchema.index({ cohortId: 1, createdAt: -1 });

const Announcement =
  mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

export default Announcement;