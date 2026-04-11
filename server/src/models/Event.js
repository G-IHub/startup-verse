import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date },
    location: { type: String, default: "" },
    attendees: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

eventSchema.index({ cohortId: 1, startsAt: 1 });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;