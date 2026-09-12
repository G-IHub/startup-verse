import mongoose from "mongoose";

// The ADJUSTABLE subset of action_types' modes. Only ever created/updated for
// an ActionType where adjustable === true — enforced in the controller, not
// just assumed here. Absence of a row means "use the ActionType's own
// defaultMode."
const autonomySettingSchema = new mongoose.Schema(
  {
    actionTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "ActionType", required: true, unique: true, index: true },
    mode: {
      type: String,
      enum: { values: ["autonomous", "ask_first"], message: "{VALUE} is not a valid mode" },
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const AutonomySetting =
  mongoose.models.AutonomySetting || mongoose.model("AutonomySetting", autonomySettingSchema);

export default AutonomySetting;
