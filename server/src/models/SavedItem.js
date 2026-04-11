import mongoose from "mongoose";

const savedItemSchema = new mongoose.Schema(
  {
    talentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemType: { 
      type: String, 
      required: [true, "Item type is required"], 
      index: true,
      maxlength: [50, "ItemType cannot exceed 50 characters"]
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

savedItemSchema.index({ talentId: 1, itemType: 1, itemId: 1 }, { unique: true });

const SavedItem = mongoose.models.SavedItem || mongoose.model("SavedItem", savedItemSchema);

export default SavedItem;