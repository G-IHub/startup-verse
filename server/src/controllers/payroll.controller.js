import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import PayrollRecord from "../models/PayrollRecord.js";
import Startup from "../models/Startup.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import * as paystack from "../services/paystackService.js";

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

/** Reads a real monthly amount out of a real compensation config, or null if this member has none. */
function monthlyAmountFromCompensation(compensation) {
  if (!compensation || typeof compensation !== "object") return null;
  if (compensation.type === "fixed" && compensation.fixed?.paymentType === "monthly") {
    return Number(compensation.fixed.amount) || null;
  }
  if (compensation.type === "equity-fixed" && compensation.fixed?.paymentType === "monthly") {
    return Number(compensation.fixed.amount) || null;
  }
  return null;
}

/**
 * Real payroll generation: for every team member with a real monthly fixed
 * compensation on file, create a "pending" PayrollRecord for the given
 * period (idempotent — the unique index on teamMemberId+period skips
 * members who already have one). Members with no fixed salary (equity-only,
 * hourly, unpaid, or no compensation set at all) are honestly skipped, not
 * defaulted to a fabricated amount.
 */
export const generatePayroll = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const periodMonth = Number(req.body?.periodMonth);
  const periodYear = Number(req.body?.periodYear);
  if (!periodMonth || periodMonth < 1 || periodMonth > 12 || !periodYear) {
    return apiError(res, "periodMonth (1-12) and periodYear are required.", 400);
  }
  const currency = String(req.body?.currency || "NGN").slice(0, 10);

  const startup = await Startup.findOne({ founderId }).select("_id").lean();
  const startupId = startup?._id || null;

  const profiles = await TeamMemberProfile.find({ founderId }).lean();
  const created = [];
  const skipped = [];

  for (const profile of profiles) {
    const amount = monthlyAmountFromCompensation(profile.compensation);
    if (!amount) {
      skipped.push({ teamMemberId: String(profile.userId), reason: "No monthly fixed compensation on file." });
      continue;
    }
    try {
      const record = await PayrollRecord.create({
        founderId,
        startupId,
        teamMemberId: profile.userId,
        periodMonth,
        periodYear,
        amount,
        currency,
        status: "pending",
      });
      created.push(record);
    } catch (error) {
      // Duplicate key = already generated for this member/period; not an error.
      if (error?.code !== 11000) throw error;
      skipped.push({ teamMemberId: String(profile.userId), reason: "Already generated for this period." });
    }
  }

  return apiSuccess(res, { created, skipped }, 201);
};

export const getPayroll = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const query = { founderId };
  if (req.query.periodMonth) query.periodMonth = Number(req.query.periodMonth);
  if (req.query.periodYear) query.periodYear = Number(req.query.periodYear);

  const records = await PayrollRecord.find(query)
    .sort({ periodYear: -1, periodMonth: -1, createdAt: -1 })
    .populate("teamMemberId", "name email")
    .lean();
  return apiSuccess(res, records);
};

/** Real tracking-only mark-as-paid — no money moves, just records that the founder paid outside the app. */
export const markPayrollPaid = async (req, res) => {
  const record = await PayrollRecord.findById(req.params.recordId);
  if (!record) return apiError(res, "Payroll record not found.", 404);
  if (!founderGuard(req, record.founderId)) return apiError(res, "Forbidden.", 403);

  record.status = "paid";
  record.paidAt = new Date();
  await record.save();
  return apiSuccess(res, record);
};

/**
 * Real Paystack payout: creates a real transfer recipient from the bank
 * details given, then initiates a real transfer for the record's amount.
 * Returns a clear 503 (not a fake success) if PAYSTACK_SECRET_KEY isn't
 * configured on the server.
 */
export const payWithPaystack = async (req, res) => {
  const record = await PayrollRecord.findById(req.params.recordId).populate("teamMemberId", "name");
  if (!record) return apiError(res, "Payroll record not found.", 404);
  if (!founderGuard(req, record.founderId)) return apiError(res, "Forbidden.", 403);
  if (record.status === "paid") return apiError(res, "This record is already marked paid.", 409);

  const { accountNumber, bankCode } = req.body || {};
  if (!accountNumber || !bankCode) {
    return apiError(res, "accountNumber and bankCode are required.", 400);
  }

  record.status = "processing";
  await record.save();

  try {
    const recipient = await paystack.createTransferRecipient({
      name: record.teamMemberId?.name || "Team member",
      accountNumber,
      bankCode,
      currency: record.currency,
    });
    const reference = `payroll_${record._id}_${Date.now()}`;
    const transfer = await paystack.initiateTransfer({
      amount: record.amount,
      recipientCode: recipient.recipient_code,
      reason: `Payroll ${record.periodMonth}/${record.periodYear}`,
      reference,
    });

    record.paystackRecipientCode = recipient.recipient_code;
    record.paystackTransferCode = transfer.transfer_code || "";
    record.paystackReference = reference;
    record.status = transfer.status === "success" ? "paid" : "processing";
    record.paidAt = record.status === "paid" ? new Date() : null;
    await record.save();
    return apiSuccess(res, record);
  } catch (error) {
    record.status = "failed";
    record.failureReason = String(error.message || "Paystack transfer failed.").slice(0, 500);
    await record.save();
    return apiError(res, record.failureReason, error.statusCode || 502);
  }
};

export const getBanks = async (req, res) => {
  try {
    const banks = await paystack.listBanks();
    return apiSuccess(res, banks);
  } catch (error) {
    return apiError(res, error.message, error.statusCode || 502);
  }
};
