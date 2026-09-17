/**
 * Founder outreach email service.
 * Sends emails FROM the founder's own Gmail account via an App Password
 * stored in their Integration record. Completely separate from the platform
 * email service (emailService.js) which handles system notifications.
 */
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";
import Integration from "../models/Integration.js";
import ScheduledEmail from "../models/ScheduledEmail.js";
import { logger } from "../config/logger.js";

async function getGmailIntegration(founderId) {
  const integration = await Integration.findOne({ founderId, type: "gmail", status: "connected" });
  if (!integration) {
    throw new Error("Gmail integration not connected. Go to Integrations and connect your Gmail account.");
  }
  return integration;
}

function createTransporter(integration) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: integration.credentials.email,
      pass: integration.credentials.appPassword,
    },
  });
}

function fromAddress(integration) {
  const name = integration.meta?.displayName || "Founder";
  return `"${name}" <${integration.credentials.email}>`;
}

/** Verify Gmail credentials without sending — used during connect flow */
export async function verifyGmailCredentials(email, appPassword) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: email, pass: appPassword },
  });
  await transporter.verify();
}

/**
 * Send a single outreach email immediately from the founder's Gmail.
 * Creates a ScheduledEmail record with final status.
 */
export async function sendFounderEmail(founderId, { recipientEmail, recipientName = "", subject, htmlBody, agentEventId = null }) {
  const integration = await getGmailIntegration(founderId);
  const transporter = createTransporter(integration);

  const record = await ScheduledEmail.create({
    founderId,
    agentEventId,
    integrationId: integration._id,
    recipientEmail,
    recipientName,
    subject,
    htmlBody,
    scheduledFor: null,
    status: "pending",
  });

  try {
    const to = recipientName ? `"${recipientName}" <${recipientEmail}>` : recipientEmail;
    await transporter.sendMail({ from: fromAddress(integration), to, subject, html: htmlBody });

    record.status = "sent";
    record.sentAt = new Date();
    await record.save();

    await Integration.findByIdAndUpdate(integration._id, { lastUsedAt: new Date() });
    logger.info("founderEmail.sent", { founderId, to: recipientEmail, subject });
    return record;
  } catch (err) {
    record.status = "failed";
    record.errorMessage = err.message;
    await record.save();
    logger.error("founderEmail.failed", { founderId, recipientEmail, error: err.message });
    throw err;
  }
}

/**
 * Send a multi-step email sequence from the founder's Gmail.
 * All steps are sent immediately; each gets its own ScheduledEmail record.
 * sequenceId groups them so they can be tracked together.
 *
 * steps: Array<{ subject: string, htmlBody: string }>
 */
export async function sendFounderEmailSequence(founderId, { recipientEmail, recipientName = "", steps = [], agentEventId = null }) {
  if (!steps.length) throw new Error("Sequence has no steps.");

  const integration = await getGmailIntegration(founderId);
  const transporter = createTransporter(integration);
  const sequenceId = randomUUID();
  const results = [];

  for (let i = 0; i < steps.length; i++) {
    const { subject, htmlBody } = steps[i];
    const record = await ScheduledEmail.create({
      founderId,
      agentEventId,
      integrationId: integration._id,
      recipientEmail,
      recipientName,
      subject,
      htmlBody,
      scheduledFor: null,
      status: "pending",
      sequenceIndex: i + 1,
      sequenceId,
    });

    try {
      const to = recipientName ? `"${recipientName}" <${recipientEmail}>` : recipientEmail;
      await transporter.sendMail({ from: fromAddress(integration), to, subject, html: htmlBody });
      record.status = "sent";
      record.sentAt = new Date();
      await record.save();
      logger.info("founderEmail.sequence.step.sent", { founderId, sequenceId, step: i + 1 });
    } catch (err) {
      record.status = "failed";
      record.errorMessage = err.message;
      await record.save();
      logger.error("founderEmail.sequence.step.failed", { founderId, sequenceId, step: i + 1, error: err.message });
    }

    results.push(record);
  }

  await Integration.findByIdAndUpdate(integration._id, { lastUsedAt: new Date() });
  return results;
}
