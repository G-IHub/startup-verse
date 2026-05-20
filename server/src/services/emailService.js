/**
 * Outbound email via SMTP (Mailtrap sandbox or production SMTP).
 * Set EMAIL_TRANSPORT=smtp and SMTP_* vars in server/.env.
 */
import nodemailer from "nodemailer";
import { logger } from "../config/logger.js";

let cachedTransporter = null;

function getSmtpConfig() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const from = String(process.env.EMAIL_FROM || "StartupVerse <noreply@startupverse.test>").trim();

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
  };
}

export function isEmailDeliveryEnabled() {
  return (
    String(process.env.EMAIL_TRANSPORT || "")
      .trim()
      .toLowerCase() === "smtp" && Boolean(getSmtpConfig())
  );
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const config = getSmtpConfig();
  if (!config) return null;

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  return cachedTransporter;
}

export function getAppBaseUrl() {
  const base =
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:3000";
  return String(base).replace(/\/$/, "");
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
    logger.info("emailService.log_only", {
      to,
      subject,
      text: text?.slice?.(0, 200),
    });
    return { sent: false, mode: "log_only" };
  }

  const config = getSmtpConfig();
  const transporter = getTransporter();
  if (!transporter || !config) {
    logger.warn("emailService.smtp_not_configured", { to, subject });
    return { sent: false, mode: "unconfigured_smtp" };
  }

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html: html || undefined,
    });
    logger.info("emailService.sent", { to, subject });
    return { sent: true, mode: "smtp" };
  } catch (err) {
    logger.error("emailService.send_failed", {
      to,
      subject,
      message: err?.message,
    });
    return { sent: false, mode: "smtp_error" };
  }
}

/**
 * Cohort invitation email sent when an org admin invites a founder.
 */
export async function sendCohortInvitationEmail({
  to,
  founderName,
  cohortName,
  organizationName,
  message,
  inviteUrl,
}) {
  const orgLabel = organizationName || "an organization";
  const cohortLabel = cohortName || "a cohort";
  const greeting = founderName ? `Hi ${founderName},` : "Hi,";
  const personalMessage = message?.trim()
    ? `\n\nMessage from ${orgLabel}:\n${message.trim()}\n`
    : "";

  const text = `${greeting}

${orgLabel} has invited you to join the cohort "${cohortLabel}" on StartupVerse.
${personalMessage}
Accept or decline your invitation here:
${inviteUrl}

This invitation link expires in 14 days.

— StartupVerse`;

  const htmlMessage = message?.trim()
    ? `<p style="margin:16px 0;padding:12px;background:#f4f6ff;border-radius:8px;"><strong>Message from ${orgLabel}:</strong><br/>${escapeHtml(message.trim())}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;color:#1a1a2e;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
  <p>${escapeHtml(greeting)}</p>
  <p><strong>${escapeHtml(orgLabel)}</strong> has invited you to join the cohort <strong>${escapeHtml(cohortLabel)}</strong> on StartupVerse.</p>
  ${htmlMessage}
  <p style="margin:24px 0;">
    <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#3a5afe;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View invitation</a>
  </p>
  <p style="font-size:13px;color:#6b7280;">This link expires in 14 days. If the button does not work, copy and paste this URL into your browser:<br/><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
  <p style="font-size:13px;color:#9ca3af;">— StartupVerse</p>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `You're invited to join ${cohortLabel} — ${orgLabel}`,
    text,
    html,
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
