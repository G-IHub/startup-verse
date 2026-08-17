import mongoose from "mongoose";

const programNoteSchema = new mongoose.Schema(
  {
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
  },
  { timestamps: true },
);

programNoteSchema.index({ cohortId: 1, createdAt: -1 });

const ProgramNote =
  mongoose.models.ProgramNote || mongoose.model("ProgramNote", programNoteSchema);

export default ProgramNote;
