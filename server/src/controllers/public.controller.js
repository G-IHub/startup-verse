import TalentWaitlistEntry from "../models/TalentWaitlistEntry.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitTalentWaitlist = async (req, res) => {
  const body = req.body || {};
  const email = String(body.email || "").toLowerCase().trim();
  const name = String(body.name || "").trim().slice(0, 200);
  if (!email || !emailRegex.test(email)) {
    return apiError(res, "Valid email is required.", 400);
  }
  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? body.payload
      : {};
  await TalentWaitlistEntry.create({
    email,
    name,
    payload,
  });
  return apiSuccess(res, { ok: true }, 201);
};
