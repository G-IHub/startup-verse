import Integration from "../models/Integration.js";
import ScheduledEmail from "../models/ScheduledEmail.js";
import { verifyGmailCredentials, sendFounderEmail, sendFounderEmailSequence } from "../services/founderEmailService.js";
import { verifyWhatsAppCredentials, sendWhatsAppMessage } from "../services/whatsappService.js";
import * as linkedinService from "../services/linkedinService.js";
import { logger } from "../config/logger.js";

// ─── Integrations CRUD ───────────────────────────────────────────────────────

/** GET /founders/:founderId/integrations */
export async function listIntegrations(req, res) {
  try {
    const { founderId } = req.params;
    const integrations = await Integration.find({ founderId }).select("-credentials").lean();
    return res.json({ success: true, data: integrations });
  } catch (err) {
    logger.error("integrations.list.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to load integrations." });
  }
}

// ─── Gmail ───────────────────────────────────────────────────────────────────

/** POST /founders/:founderId/integrations/gmail/connect */
export async function connectGmail(req, res) {
  try {
    const { founderId } = req.params;
    const { email, appPassword, displayName } = req.body || {};

    if (!email || !appPassword) {
      return res.status(400).json({ ok: false, message: "Email and App Password are required." });
    }

    // Verify credentials before saving
    try {
      await verifyGmailCredentials(email, appPassword);
    } catch {
      return res.status(400).json({ ok: false, message: "Could not verify Gmail credentials. Check your email and App Password." });
    }

    const integration = await Integration.findOneAndUpdate(
      { founderId, type: "gmail" },
      {
        status: "connected",
        credentials: { email, appPassword },
        meta: { displayName: displayName || email },
        connectedAt: new Date(),
        errorMessage: "",
      },
      { upsert: true, new: true },
    );

    // Return without credentials
    const safe = integration.toObject();
    delete safe.credentials;
    return res.json({ success: true, data: safe });
  } catch (err) {
    logger.error("integrations.gmail.connect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to connect Gmail." });
  }
}

/** DELETE /founders/:founderId/integrations/gmail */
export async function disconnectGmail(req, res) {
  try {
    const { founderId } = req.params;
    await Integration.findOneAndUpdate(
      { founderId, type: "gmail" },
      { status: "disconnected", credentials: { email: "", appPassword: "" }, errorMessage: "" },
    );
    return res.json({ success: true, data: {} });
  } catch (err) {
    logger.error("integrations.gmail.disconnect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to disconnect Gmail." });
  }
}

// ─── Email sending ───────────────────────────────────────────────────────────

/** POST /founders/:founderId/integrations/email/send */
export async function sendOutreachEmail(req, res) {
  try {
    const { founderId } = req.params;
    const { recipientEmail, recipientName, subject, htmlBody, agentEventId } = req.body || {};

    if (!recipientEmail || !subject || !htmlBody) {
      return res.status(400).json({ ok: false, message: "recipientEmail, subject, and htmlBody are required." });
    }

    const record = await sendFounderEmail(founderId, { recipientEmail, recipientName, subject, htmlBody, agentEventId });
    return res.json({ success: true, data: record });
  } catch (err) {
    logger.error("integrations.email.send.error", { error: err.message });
    return res.status(500).json({ ok: false, message: err.message });
  }
}

/** POST /founders/:founderId/integrations/email/sequence */
export async function sendOutreachSequence(req, res) {
  try {
    const { founderId } = req.params;
    const { recipientEmail, recipientName, steps, agentEventId } = req.body || {};

    if (!recipientEmail || !Array.isArray(steps) || !steps.length) {
      return res.status(400).json({ ok: false, message: "recipientEmail and steps[] are required." });
    }

    const records = await sendFounderEmailSequence(founderId, { recipientEmail, recipientName, steps, agentEventId });
    return res.json({ success: true, data: records });
  } catch (err) {
    logger.error("integrations.email.sequence.error", { error: err.message });
    return res.status(500).json({ ok: false, message: err.message });
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/** POST /founders/:founderId/integrations/whatsapp/connect */
export async function connectWhatsApp(req, res) {
  try {
    const { founderId } = req.params;
    const { accessToken, phoneNumberId, displayName } = req.body || {};

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({ ok: false, message: "accessToken and phoneNumberId are required." });
    }

    let verifiedMeta = {};
    try {
      const info = await verifyWhatsAppCredentials(accessToken, phoneNumberId);
      verifiedMeta = {
        phoneNumberId,
        fromPhoneNumber: info.display_phone_number || "",
        displayName: displayName || info.verified_name || "WhatsApp Business",
      };
    } catch (err) {
      return res.status(400).json({ ok: false, message: err.message || "Could not verify WhatsApp credentials." });
    }

    const integration = await Integration.findOneAndUpdate(
      { founderId, type: "whatsapp" },
      {
        status: "connected",
        credentials: { apiKey: accessToken, accessToken },
        meta: verifiedMeta,
        connectedAt: new Date(),
        errorMessage: "",
      },
      { upsert: true, new: true },
    );

    const safe = integration.toObject();
    delete safe.credentials;
    return res.json({ success: true, data: safe });
  } catch (err) {
    logger.error("integrations.whatsapp.connect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to connect WhatsApp." });
  }
}

/** DELETE /founders/:founderId/integrations/whatsapp */
export async function disconnectWhatsApp(req, res) {
  try {
    const { founderId } = req.params;
    await Integration.findOneAndUpdate(
      { founderId, type: "whatsapp" },
      { status: "disconnected", credentials: {}, meta: {}, errorMessage: "" },
    );
    return res.json({ success: true, data: {} });
  } catch (err) {
    logger.error("integrations.whatsapp.disconnect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to disconnect WhatsApp." });
  }
}

/** POST /founders/:founderId/integrations/whatsapp/send */
export async function sendWhatsAppOutreach(req, res) {
  try {
    const { founderId } = req.params;
    const { recipientPhone, message } = req.body || {};

    if (!recipientPhone || !message) {
      return res.status(400).json({ ok: false, message: "recipientPhone and message are required." });
    }

    const result = await sendWhatsAppMessage(founderId, { recipientPhone, message });
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error("integrations.whatsapp.send.error", { error: err.message });
    return res.status(500).json({ ok: false, message: err.message });
  }
}

// ─── Social profiles (LinkedIn, Instagram, Facebook) ─────────────────────────
// These platforms have no usable DM API for cold outreach.
// We store the founder's profile URL and let the workspace show
// a "Copy & Open" modal so they can paste the AI-drafted content manually.

/** POST /founders/:founderId/integrations/social/connect
 *  body: { type: "linkedin"|"instagram"|"facebook", profileUrl, displayName }
 */
export async function connectSocial(req, res) {
  try {
    const { founderId } = req.params;
    const { type, profileUrl, displayName } = req.body || {};
    const SOCIAL_TYPES = ["linkedin", "instagram", "facebook"];

    if (!SOCIAL_TYPES.includes(type)) {
      return res.status(400).json({ ok: false, message: `type must be one of: ${SOCIAL_TYPES.join(", ")}` });
    }
    if (!profileUrl) {
      return res.status(400).json({ ok: false, message: "profileUrl is required." });
    }

    const integration = await Integration.findOneAndUpdate(
      { founderId, type },
      {
        status: "connected",
        credentials: {},
        meta: { profileUrl, displayName: displayName || type },
        connectedAt: new Date(),
        errorMessage: "",
      },
      { upsert: true, new: true },
    );

    const safe = integration.toObject();
    delete safe.credentials;
    return res.json({ success: true, data: safe });
  } catch (err) {
    logger.error("integrations.social.connect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to save social profile." });
  }
}

/** DELETE /founders/:founderId/integrations/social/:type */
export async function disconnectSocial(req, res) {
  try {
    const { founderId, type } = req.params;
    await Integration.findOneAndUpdate(
      { founderId, type },
      { status: "disconnected", credentials: {}, meta: {}, errorMessage: "" },
    );
    return res.json({ success: true, data: {} });
  } catch (err) {
    logger.error("integrations.social.disconnect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to disconnect." });
  }
}

// ─── LinkedIn OAuth ───────────────────────────────────────────────────────────

/** GET /founders/:founderId/integrations/linkedin/oauth/start */
export async function linkedInOAuthStart(req, res) {
  if (!linkedinService.isConfigured()) {
    return res.status(400).json({ ok: false, configured: false, message: "LinkedIn OAuth is not configured on this server. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET." });
  }
  const { founderId } = req.params;
  const authUrl = linkedinService.buildAuthUrl(founderId);
  return res.json({ success: true, data: { authUrl, configured: true } });
}

/** GET /integrations/linkedin/oauth/callback  (no requireAuth — browser redirect from LinkedIn) */
export async function linkedInOAuthCallback(req, res) {
  const CLOSE_PAGE = "<html><body><script>window.close();</script></body></html>";
  const { code, state: founderId, error } = req.query;

  if (error || !code || !founderId) {
    logger.warn("linkedin.oauth.callback.denied", { error, founderId });
    return res.send(CLOSE_PAGE);
  }

  try {
    const tokens = await linkedinService.exchangeCode(code);
    const userInfo = await linkedinService.getUserInfo(tokens.access_token);

    await Integration.findOneAndUpdate(
      { founderId, type: "linkedin" },
      {
        status: "connected",
        credentials: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || "" },
        meta: { personUrn: userInfo.personUrn, displayName: userInfo.displayName, picture: userInfo.picture },
        connectedAt: new Date(),
        errorMessage: "",
      },
      { upsert: true, new: true },
    );
    logger.info("linkedin.oauth.callback.success", { founderId, displayName: userInfo.displayName });
  } catch (err) {
    logger.error("linkedin.oauth.callback.error", { error: err.message, founderId });
  }

  return res.send(CLOSE_PAGE);
}

/** POST /founders/:founderId/integrations/linkedin/post */
export async function postToLinkedIn(req, res) {
  const { founderId } = req.params;
  const { text } = req.body || {};

  if (!text?.trim()) {
    return res.status(400).json({ ok: false, message: "text is required." });
  }

  try {
    const result = await linkedinService.publishPost(founderId, text);
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error("linkedin.post.error", { error: err.message, founderId });
    return res.status(500).json({ ok: false, message: err.message });
  }
}

/** DELETE /founders/:founderId/integrations/linkedin */
export async function disconnectLinkedIn(req, res) {
  const { founderId } = req.params;
  try {
    await Integration.findOneAndUpdate(
      { founderId, type: "linkedin" },
      { status: "disconnected", credentials: {}, meta: {}, errorMessage: "" },
    );
    return res.json({ success: true, data: {} });
  } catch (err) {
    logger.error("linkedin.disconnect.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to disconnect LinkedIn." });
  }
}

/** GET /founders/:founderId/integrations/email/history */
export async function getEmailHistory(req, res) {
  try {
    const { founderId } = req.params;
    const { limit = 50, status } = req.query;
    const filter = { founderId };
    if (status) filter.status = status;

    const emails = await ScheduledEmail.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 200))
      .lean();

    return res.json({ success: true, data: emails });
  } catch (err) {
    logger.error("integrations.email.history.error", { error: err.message });
    return res.status(500).json({ ok: false, message: "Failed to load email history." });
  }
}
