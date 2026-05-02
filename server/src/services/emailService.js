/**
 * Outbound email. When EMAIL_TRANSPORT is not "smtp", messages are logged only.
 */
import { logger } from "../config/logger.js";

export function isEmailDeliveryEnabled() {
  return String(process.env.EMAIL_TRANSPORT || "")
    .trim()
    .toLowerCase() === "smtp";
}

/**
 * @param {{ to: string; subject: string; text?: string; html?: string }} opts
 * @returns {Promise<{ sent: boolean; mode: string }>}
 */
export async function sendEmail(opts) {
  const { to, subject, text = "", html = "" } = opts || {};
  if (!to || !subject) {
    logger.warn("emailService.skip", { reason: "missing to or subject" });
    return { sent: false, mode: "skipped" };
  }

  if (!isEmailDeliveryEnabled()) {
    logger.info("emailService.log_only", { to, subject, text: text?.slice?.(0, 200) });
    return { sent: false, mode: "log_only" };
  }

  logger.warn("emailService.smtp_not_wired", { to, subject });
  return { sent: false, mode: "unconfigured_smtp" };
}
