import mongoose from "mongoose";

const PAYROLL_STATUSES = ["pending", "processing", "paid", "failed"];

const payrollRecordSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", default: null },
    teamMemberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    periodMonth: { type: Number, required: true, min: 1, max: 12 },
    periodYear: { type: Number, required: true, min: 2020, max: 2100 },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN", maxlength: 10 },

    status: { type: String, enum: PAYROLL_STATUSES, default: "pending", index: true },
    paidAt: { type: Date, default: null },

    // Real Paystack transfer wiring — populated only if a real transfer was
    // actually initiated (requires PAYSTACK_SECRET_KEY configured server-side).
    paystackRecipientCode: { type: String, default: "" },
    paystackTransferCode: { type: String, default: "" },
    paystackReference: { type: String, default: "" },
    failureReason: { type: String, default: "" },
  },
  { timestamps: true },
);

payrollRecordSchema.index({ teamMemberId: 1, periodMonth: 1, periodYear: 1 }, { unique: true });
payrollRecordSchema.index({ founderId: 1, periodYear: 1, periodMonth: 1 });

const PayrollRecord =
  mongoose.models.PayrollRecord || mongoose.model("PayrollRecord", payrollRecordSchema);

export default PayrollRecord;
export { PAYROLL_STATUSES };
