import mongoose from "mongoose";

const ANNOUNCEMENT_PRIORITIES = ["low", "normal", "high", "urgent"];
const ANNOUNCEMENT_CATEGORIES = ["general", "wall-of-wins", "team-events"];

const announcementSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    priority: {
      type: String,
      default: "normal",
      index: true,
      enum: ANNOUNCEMENT_PRIORITIES,
    },
    category: {
      type: String,
      default: "general",
      index: true,
      enum: ANNOUNCEMENT_CATEGORIES,
    },
    emoji: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

announcementSchema.index({ cohortId: 1, createdAt: -1 });
announcementSchema.index({ founderId: 1, createdAt: -1, _id: -1 });
announcementSchema.index({ title: "text", body: "text" });

const Announcement =
  mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

export default Announcement;