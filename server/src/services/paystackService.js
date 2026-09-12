/**
 * Real Paystack REST integration for paying team members from the V2 Team
 * page's payroll flow. Every function here makes a genuine call to
 * https://api.paystack.co when PAYSTACK_SECRET_KEY is configured — nothing
 * here fabricates a transfer or a success response.
 *
 * Not configured in this dev environment (no key in server/.env yet). Until
 * a real key is added, isPaystackConfigured() returns false and every other
 * function throws a clear, honest error instead of pretending to succeed —
 * same pattern this codebase already uses for LiveKit (VITE_LIVEKIT_URL).
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function requireConfigured() {
  if (!isPaystackConfigured()) {
    const err = new Error(
      "Payroll payment provider is not configured. Add PAYSTACK_SECRET_KEY to server/.env to enable real payouts.",
    );
    err.statusCode = 503;
    throw err;
  }
}

async function paystackRequest(path, options = {}) {
  requireConfigured();
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.status === false) {
    const err = new Error(body?.message || `Paystack request failed (${response.status}).`);
    err.statusCode = response.status;
    err.paystackBody = body;
    throw err;
  }
  return body;
}

/**
 * Create (or reuse) a Paystack transfer recipient for a team member's bank
 * account. Real call to POST /transferrecipient.
 */
export async function createTransferRecipient({ name, accountNumber, bankCode, currency = "NGN" }) {
  const body = await paystackRequest("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    }),
  });
  return body.data; // { recipient_code, ... }
}

/**
 * Initiate a real transfer to a previously-created recipient. Real call to
 * POST /transfer. Requires the founder's Paystack balance to actually cover
 * the amount — Paystack itself will reject it otherwise.
 */
export async function initiateTransfer({ amount, recipientCode, reason, reference }) {
  const body = await paystackRequest("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(Number(amount) * 100), // Paystack expects kobo
      recipient: recipientCode,
      reason,
      reference,
    }),
  });
  return body.data; // { transfer_code, status, reference, ... }
}

/** Verify a transfer's real current status. Real call to GET /transfer/:reference. */
export async function verifyTransfer(reference) {
  const body = await paystackRequest(`/transfer/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
  return body.data;
}

/** List real Nigerian banks + codes, for the founder to pick from when paying a member. */
export async function listBanks() {
  const body = await paystackRequest("/bank?currency=NGN", { method: "GET" });
  return body.data;
}
