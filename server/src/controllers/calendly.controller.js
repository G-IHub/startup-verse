import CalendlyConnection from "../models/CalendlyConnection.js";
import Task from "../models/Task.js";
import Milestone from "../models/Milestone.js";
import Startup from "../models/Startup.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import {
  calendlyConfigured,
  encryptCalendlyToken,
  decryptCalendlyToken,
  signOauthState,
  verifyOauthState,
  verifyWebhookSignature,
} from "../utils/calendlyCrypto.js";
import { syncMilestoneCounters } from "../utils/syncMilestoneCounters.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
import { logger } from "../config/logger.js";

const CALENDLY_API = "https://api.calendly.com";
const CALENDLY_AUTH = "https://auth.calendly.com";

function requireFounder(req, res) {
  if (req.user?.isAdmin === true) return true;
  if (req.user?.role === "founder") return true;
  apiError(res, "Forbidden.", 403);
  return false;
}

function popupHtml(ok, message) {
  const safe = String(message || "").replace(/[<>]/g, "");
  return `<!doctype html><html><body><p>${ok ? "Connected." : safe}</p><script>window.close();</script></body></html>`;
}

async function calendlyFetch(path, accessToken, options = {}) {
  const res = await fetch(`${CALENDLY_API}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  return { status: res.status, data };
}

export async function authorize(req, res) {
  if (!requireFounder(req, res)) return;
  if (!calendlyConfigured()) {
    return apiError(res, "Calendly is not configured. Set CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET, CALENDLY_REDIRECT_URI, and an encryption key.", 503);
  }
  const state = signOauthState(req.user.id);
  const params = new URLSearchParams({
    client_id: process.env.CALENDLY_CLIENT_ID,
    redirect_uri: process.env.CALENDLY_REDIRECT_URI,
    response_type: "code",
    state,
  });
  return apiSuccess(res, { authUrl: `${CALENDLY_AUTH}/oauth/authorize?${params}` });
}

export async function callback(req, res) {
  const { code, state, error: oauthError } = req.query;
  if (oauthError) {
    return res.send(popupHtml(false, `Calendly OAuth error: ${oauthError}`));
  }
  const userId = verifyOauthState(state);
  if (!userId) {
    return res.send(popupHtml(false, "Invalid or expired OAuth state. Try connecting again."));
  }
  if (!calendlyConfigured()) {
    return res.send(popupHtml(false, "Calendly is not configured on this server."));
  }

  // Exchange authorization code for tokens
  let tokenData;
  try {
    const tokenRes = await fetch(`${CALENDLY_AUTH}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.CALENDLY_REDIRECT_URI,
        client_id: process.env.CALENDLY_CLIENT_ID,
        client_secret: process.env.CALENDLY_CLIENT_SECRET,
      }),
    });
    tokenData = await tokenRes.json();
  } catch (err) {
    logger.error("[calendly] token exchange failed", { message: err.message });
    return res.send(popupHtml(false, "Could not exchange Calendly token."));
  }

  if (!tokenData?.access_token) {
    return res.send(popupHtml(false, tokenData?.error_description || "Calendly token exchange failed."));
  }

  // Fetch the Calendly user's info (booking URL + user URI)
  const { data: me } = await calendlyFetch("/users/me", tokenData.access_token);
  if (!me?.resource?.scheduling_url) {
    return res.send(popupHtml(false, "Could not read Calendly profile. Try again."));
  }

  const { scheduling_url: bookingUrl, uri: userUri, current_organization: organizationUri } = me.resource;

  // Encrypt and save the connection (upsert — replacing any prior connection)
  const conn = await CalendlyConnection.findOneAndUpdate(
    { founderId: userId },
    {
      founderId: userId,
      accessTokenEncrypted: encryptCalendlyToken(tokenData.access_token),
      refreshTokenEncrypted: tokenData.refresh_token ? encryptCalendlyToken(tokenData.refresh_token) : "",
      organizationUri: organizationUri || "",
      userUri,
      bookingUrl,
      webhookSubscriptionUri: "",
      webhookSigningKeyEncrypted: "",
      revokedAt: null,
    },
    { upsert: true, new: true },
  );

  // Register a webhook subscription so we get booking notifications.
  // Best-effort — a failed webhook subscription doesn't block the connection.
  const webhookUrl = process.env.CALENDLY_WEBHOOK_URL ||
    `${process.env.API_BASE_URL || "http://localhost:5000"}/api/v1/calendly/webhook`;

  try {
    const { status: whStatus, data: whData } = await calendlyFetch(
      "/webhook_subscriptions",
      tokenData.access_token,
      {
        method: "POST",
        body: {
          url: webhookUrl,
          events: ["invitee.created"],
          organization: organizationUri || userUri,
          user: userUri,
          scope: "user",
        },
      },
    );
    if (whStatus === 201 && whData?.resource?.uri) {
      const signingKey = whData.resource.signing_key || "";
      await CalendlyConnection.findByIdAndUpdate(conn._id, {
        webhookSubscriptionUri: whData.resource.uri,
        webhookSigningKeyEncrypted: signingKey ? encryptCalendlyToken(signingKey) : "",
      });
    } else {
      logger.warn("[calendly] webhook subscription failed", { status: whStatus, error: whData?.message });
    }
  } catch (err) {
    logger.warn("[calendly] webhook subscription error (non-fatal)", { message: err.message });
  }

  return res.send(popupHtml(true, "Connected"));
}

export async function getConnection(req, res) {
  if (!requireFounder(req, res)) return;
  const founderId = req.params.founderId || req.user.id;
  const conn = await CalendlyConnection.findOne({ founderId, revokedAt: null }).lean();
  return apiSuccess(res, {
    connected: Boolean(conn),
    configured: calendlyConfigured(),
    bookingUrl: conn?.bookingUrl || "",
    userUri: conn?.userUri || "",
    hasWebhook: Boolean(conn?.webhookSubscriptionUri),
  });
}

export async function disconnect(req, res) {
  if (!requireFounder(req, res)) return;
  const founderId = req.params.founderId || req.user.id;
  const conn = await CalendlyConnection.findOne({ founderId, revokedAt: null });
  if (!conn) return apiSuccess(res, { disconnected: true });

  // Best-effort: delete the webhook subscription from Calendly before revoking.
  if (conn.webhookSubscriptionUri && conn.accessTokenEncrypted) {
    try {
      const token = decryptCalendlyToken(conn.accessTokenEncrypted);
      const uriParts = conn.webhookSubscriptionUri.split("/");
      const uuid = uriParts[uriParts.length - 1];
      await calendlyFetch(`/webhook_subscriptions/${uuid}`, token, { method: "DELETE" });
    } catch (err) {
      logger.warn("[calendly] webhook deletion failed (non-fatal)", { message: err.message });
    }
  }

  conn.revokedAt = new Date();
  await conn.save();
  return apiSuccess(res, { disconnected: true });
}

/**
 * Calendly webhook — public endpoint, no auth.
 * Receives invitee.created events and creates a real Task in the Execution Engine.
 * Security: verifies the Calendly-Webhook-Signature JWT when a signing key is stored.
 */
export async function handleWebhook(req, res) {
  // Acknowledge immediately — Calendly retries on non-2xx within 3s
  res.status(200).json({ received: true });

  const event = req.body?.event;
  if (event !== "invitee.created") return;

  const payload = req.body?.payload || {};
  const invitee = payload.invitee || {};
  const scheduledEvent = payload.scheduled_event || {};
  const eventTypeName = payload.event_type?.name || "Meeting";

  const inviteeName = invitee.name || "Someone";
  const inviteeEmail = invitee.email || "";
  const startTime = scheduledEvent.start_time ? new Date(scheduledEvent.start_time) : null;

  // Find the Calendly user URI from the event memberships to look up the founder
  const memberUri = (scheduledEvent.event_memberships || [])[0]?.user || "";

  let conn = null;
  if (memberUri) {
    conn = await CalendlyConnection.findOne({ userUri: memberUri, revokedAt: null }).lean();
  }
  if (!conn) {
    // Fallback: try to match by organization URI
    const orgUri = payload.organization || scheduledEvent.organization || "";
    if (orgUri) conn = await CalendlyConnection.findOne({ organizationUri: orgUri, revokedAt: null }).lean();
  }
  if (!conn) {
    logger.warn("[calendly] webhook: could not match event to a founder", { memberUri });
    return;
  }

  // Verify webhook signature if we have the signing key
  if (conn.webhookSigningKeyEncrypted) {
    try {
      const signingKey = decryptCalendlyToken(conn.webhookSigningKeyEncrypted);
      const sig = req.headers["calendly-webhook-signature"] || "";
      if (sig && !verifyWebhookSignature(signingKey, sig, logger)) {
        logger.warn("[calendly] webhook: signature mismatch — ignoring event");
        return;
      }
    } catch (err) {
      logger.warn("[calendly] webhook: signing key decryption failed", { message: err.message });
    }
  }

  try {
    const startup = await Startup.findOne({ founderId: conn.founderId }).lean();
    if (!startup) return;

    const founderId = conn.founderId;
    const startupId = startup._id;

    // Find or create a "Meetings & Calls" milestone under the active weekly outcome.
    // If no active outcome exists, create the task without a milestone (shows in task panel).
    let milestoneId = null;
    try {
      const outcome = await WeeklyOutcome.findOne({ founderId, status: "active" }).sort({ weekOf: -1 }).lean();
      if (outcome) {
        let milestone = await Milestone.findOne({
          founderId,
          startupId,
          title: "Meetings & Calls",
          weeklyOutcomeId: outcome._id,
        });
        if (!milestone) {
          milestone = await Milestone.create({
            founderId,
            startupId,
            weeklyOutcomeId: outcome._id,
            title: "Meetings & Calls",
            description: "Booked calls and meetings from Calendly",
            status: "in-progress",
          });
        }
        milestoneId = milestone._id;
      }
    } catch (err) {
      logger.warn("[calendly] webhook: milestone find/create failed, creating task without milestone", { message: err.message });
    }

    const title = `Call: ${inviteeName}${eventTypeName ? ` — ${eventTypeName}` : ""}`;
    const description = [
      inviteeEmail ? `Booked by ${inviteeEmail}.` : "",
      startTime ? `Scheduled for ${startTime.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC.` : "",
    ].filter(Boolean).join(" ");

    const task = await Task.create({
      founderId,
      startupId,
      milestoneId: milestoneId || undefined,
      title,
      description,
      status: "pending",
      priority: "medium",
      dueDate: startTime || undefined,
    });

    if (milestoneId) await syncMilestoneCounters(milestoneId);

    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [
      userRoom(String(founderId)),
      startupRoom(String(startupId)),
    ]);

    logger.info("[calendly] webhook: task created for booking", {
      taskId: String(task._id),
      founderId: String(founderId),
      inviteeEmail,
    });
  } catch (err) {
    logger.error("[calendly] webhook: task creation failed", { message: err.message });
  }
}
