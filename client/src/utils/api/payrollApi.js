/**
 * Payroll API client — real backend (server/src/controllers/payroll.controller.js),
 * a real Paystack integration for actually paying team members
 * (server/src/services/paystackService.js), gated on PAYSTACK_SECRET_KEY
 * being configured server-side. Never fabricates a paid status.
 */
import { request } from "../backendClient";

async function apiRequest(endpoint, options = {}) {
  const payload = await request(endpoint, options);
  return payload.data;
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Generates pending payroll records for the given month/year from real fixed compensation on file. */
export async function generatePayroll(founderId, { periodMonth, periodYear, currency } = {}) {
  return apiRequest(`/founders/${founderId}/payroll/generate`, {
    method: "POST",
    body: JSON.stringify({ periodMonth, periodYear, currency }),
  });
}

export async function getPayroll(founderId, params = {}) {
  return apiRequest(`/founders/${founderId}/payroll${buildQueryString(params)}`, { method: "GET" });
}

/** Real tracking-only: marks a record paid without moving money (e.g. founder paid via bank transfer directly). */
export async function markPayrollPaid(recordId) {
  return apiRequest(`/payroll/${recordId}/mark-paid`, { method: "POST" });
}

/** Real Paystack payout — throws a clear error if PAYSTACK_SECRET_KEY isn't configured. */
export async function payWithPaystack(recordId, { accountNumber, bankCode }) {
  return apiRequest(`/payroll/${recordId}/pay-with-paystack`, {
    method: "POST",
    body: JSON.stringify({ accountNumber, bankCode }),
  });
}

/** Real Nigerian bank list from Paystack, for the "pay via Paystack" bank picker. */
export async function getBanks() {
  return apiRequest("/payroll/banks", { method: "GET" });
}
