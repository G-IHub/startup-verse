import mongoose from "mongoose";
import { OFFER_STATUSES, OFFER_KPI_TIERS, OFFER_ROLE_TYPES } from "../utils/enums.js";

const offerSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    talentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", default: null },

    role: { type: String, required: [true, "Role is required"], trim: true, maxlength: 200 },
    roleType: {
      type: String,
      enum: { values: [...OFFER_ROLE_TYPES, ""], message: "{VALUE} is not a valid role type" },
      default: "",
    },
    startDate: { type: Date, default: null },

    salaryAmount: { type: String, default: "", maxlength: 20 },
    currency: { type: String, default: "", maxlength: 10 },

    kpiBonusTier: {
      type: String,
      enum: { values: [...OFFER_KPI_TIERS, ""], message: "{VALUE} is not a valid KPI tier" },
      default: "",
    },
    kpiBonusPercent: { type: Number, default: 0, min: 0, max: 100 },

    equityPercent: { type: String, default: "", maxlength: 10 },
    vestingMonths: { type: Number, default: 0, min: 0 },
    cliffMonths: { type: Number, default: 0, min: 0 },

    message: { type: String, default: "", maxlength: 2000 },
    expiresAt: { type: Date, default: null },

    status: {
      type: String,
      enum: { values: OFFER_STATUSES, message: "{VALUE} is not a valid offer status" },
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

offerSchema.index({ founderId: 1, createdAt: -1 });
offerSchema.index({ talentId: 1, createdAt: -1 });

const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

export default Offer;
