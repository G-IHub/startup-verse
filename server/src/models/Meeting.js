import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["meeting", "video-call"], default: "meeting" },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, default: "" },
    attendees: { type: [String], default: [] },
    status: { type: String, enum: ["scheduled", "cancelled", "completed"], default: "scheduled" },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: { type: String, enum: ["daily", "weekly", "monthly"], default: null },
    recurrenceEndType: { type: String, enum: ["occurrences", "date"], default: null },
    recurrenceEndDate: { type: String, default: null },
    recurrenceOccurrences: { type: Number, default: null },
    weeklyDays: { type: [Number], default: [] },
    recurrenceGroupId: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

meetingSchema.index({ startupId: 1, date: 1 });
meetingSchema.index({ organizerId: 1, date: 1 });

const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export default Meeting;
