import mongoose from "mongoose";

const googleConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    email: { type: String, trim: true, default: "" },
    accessTokenEnc: { type: String, default: "" },
    refreshTokenEnc: { type: String, default: "" },
    expiryDate: { type: Date, default: null },
    scopes: { type: [String], default: [] },
  },
  { timestamps: true },
);

googleConnectionSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.accessTokenEnc;
    delete ret.refreshTokenEnc;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("GoogleConnection", googleConnectionSchema);
