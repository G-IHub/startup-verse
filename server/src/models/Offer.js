import mongoose from "mongoose";
import {
  OFFER_STATUSES,
  OFFER_KPI_TIERS,
  OFFER_ROLE_TYPES,
  OFFER_EMPLOYMENT_TYPES,
  OFFER_WORK_LOCATIONS,
  OFFER_COMPENSATION_MODELS,
  OFFER_PAYMENT_SCHEDULES,
  OFFER_BONUS_STRUCTURES,
  OFFER_ACCELERATED_VESTING_OPTIONS,
} from "../utils/enums.js";

// A performance tier proposed in the offer (e.g. "80-89% completion -> $3,500/mo").
// Real, saved data the candidate sees — but only Tier 1 (the base/floor) is what
// gets mapped into TeamMemberProfile.compensation on acceptance; tiers 2/3 are
// informational until the payroll engine supports multi-tier comp.
const performanceTierSchema = new mongoose.Schema(
  {
    tierNumber: { type: Number, required: true, min: 1, max: 3 },
    label: { type: String, default: "", maxlength: 100 },
    completionMin: { type: Number, default: 0, min: 0, max: 100 },
    completionMax: { type: Number, default: null, min: 0, max: 100 },
    monthlyCash: { type: Number, default: 0, min: 0 },
    bonusAmount: { type: Number, default: 0, min: 0 },
    qualityScoreThreshold: { type: Number, default: null, min: 0, max: 100 },
    additionalEquityPercent: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// A weighted KPI shown to the candidate. Real, saved — not yet auto-scored
// anywhere (no KPI-tracking engine exists), so weight/enabled are informational
// until that's built.
const offerKpiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 200 },
    target: { type: String, default: "", maxlength: 100 },
    weight: { type: Number, default: 0, min: 0, max: 100 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

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
    employmentType: {
      type: String,
      enum: { values: [...OFFER_EMPLOYMENT_TYPES, ""], message: "{VALUE} is not a valid employment type" },
      default: "",
    },
    startDate: { type: Date, default: null },
    probationDays: { type: Number, default: 90, min: 0 },
    reportingTo: { type: String, default: "", maxlength: 200 },
    workLocation: {
      type: String,
      enum: { values: [...OFFER_WORK_LOCATIONS, ""], message: "{VALUE} is not a valid work location" },
      default: "",
    },
    responsibilities: { type: String, default: "", maxlength: 2000 },

    compensationModel: {
      type: String,
      enum: { values: [...OFFER_COMPENSATION_MODELS, ""], message: "{VALUE} is not a valid compensation model" },
      default: "salary",
    },
    salaryAmount: { type: String, default: "", maxlength: 20 },
    currency: { type: String, default: "", maxlength: 10 },
    paymentSchedule: {
      type: String,
      enum: { values: [...OFFER_PAYMENT_SCHEDULES, ""], message: "{VALUE} is not a valid payment schedule" },
      default: "",
    },
    bonusStructure: {
      type: String,
      enum: { values: [...OFFER_BONUS_STRUCTURES, ""], message: "{VALUE} is not a valid bonus structure" },
      default: "",
    },

    performanceTiers: { type: [performanceTierSchema], default: [] },
    kpis: { type: [offerKpiSchema], default: [] },

    kpiBonusTier: {
      type: String,
      enum: { values: [...OFFER_KPI_TIERS, ""], message: "{VALUE} is not a valid KPI tier" },
      default: "",
    },
    kpiBonusPercent: { type: Number, default: 0, min: 0, max: 100 },

    equityPercent: { type: String, default: "", maxlength: 10 },
    vestingMonths: { type: Number, default: 0, min: 0 },
    cliffMonths: { type: Number, default: 0, min: 0 },
    acceleratedVesting: {
      type: String,
      enum: { values: [...OFFER_ACCELERATED_VESTING_OPTIONS, ""], message: "{VALUE} is not a valid accelerated-vesting option" },
      default: "",
    },
    valuationAtOffer: { type: Number, default: null, min: 0 },

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
