/**
 * WhatsApp Business Cloud API (Meta) sender.
 * Sends from the founder's registered WhatsApp Business number.
 *
 * Credentials stored in Integration.credentials:
 *   - apiKey       → permanent system-user access token from Meta Business Manager
 *   - accessToken  → (alias, same value)
 * Credentials stored in Integration.meta:
 *   - phoneNumberId   → the WhatsApp phone number ID from Meta (not the actual number)
 *   - fromPhoneNumber → the human-readable business number e.g. +234...
 *   - displayName     → business name shown in chats
 */
import Integration from "../models/Integration.js";
import { logger } from "../config/logger.js";

const GRAPH_VERSION = "v18.0";
const GRAPH_BASE = "https://graph.facebook.com";

async function getWhatsAppIntegration(founderId) {
  const integration = await Integration.findOne({ founderId, type: "whatsapp", status: "connected" });
  if (!integration) {
    throw new Error("WhatsApp Business integration not connected. Go to Integrations to connect.");
  }
  return integration;
}

/**
 * Send a plain-text WhatsApp message via Meta Cloud API.
 * @param {string} founderId
 * @param {{ recipientPhone: string, message: string }} opts
 *   recipientPhone must include country code, no spaces/dashes, e.g. "2348012345678"
 */
export async function sendWhatsAppMessage(founderId, { recipientPhone, message }) {
  const integration = await getWhatsAppIntegration(founderId);
  const accessToken = integration.credentials.apiKey || integration.credentials.accessToken;
  const phoneNumberId = integration.meta?.phoneNumberId;

  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp integration is missing credentials. Please reconnect.");
  }

  const url = `${GRAPH_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: recipientPhone.replace(/\D/g, ""), // strip non-digits
    type: "text",
    text: { body: message },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || `Meta API error ${res.status}`;
    logger.error("whatsapp.send.failed", { founderId, recipientPhone, error: errMsg });
    throw new Error(errMsg);
  }

  const data = await res.json();
  await Integration.findByIdAndUpdate(integration._id, { lastUsedAt: new Date() });
  logger.info("whatsapp.sent", { founderId, recipientPhone, messageId: data?.messages?.[0]?.id });
  return data;
}

/**
 * Verify WhatsApp Cloud API credentials without sending.
 * Calls GET /phone_number_id to confirm the token + phone ID are valid.
 */
export async function verifyWhatsAppCredentials(accessToken, phoneNumberId) {
  const url = `${GRAPH_BASE}/${GRAPH_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || "Invalid WhatsApp credentials.");
  }
  return res.json(); // { display_phone_number, verified_name }
}
