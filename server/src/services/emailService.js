/**
 * Outbound email transport — Step 2.11 (Mailtrap).
 *
 * Driver selection mirrors `uploadService.js`: an explicit `EMAIL_DRIVER`
 * env var wins; otherwise we auto-pick `mailtrap` when `MAILTRAP_API_TOKEN` is
 * present and fall back to `log` so dev/CI stays zero-config.
 *
 * Env contract:
 *   EMAIL_DRIVER          "mailtrap" | "log"  (default: auto)
 *   MAILTRAP_API_TOKEN    required when driver is "mailtrap"
 *   MAILTRAP_USE_SANDBOX  "true" to send to Email Sandbox (dev/testing)
 *   MAILTRAP_INBOX_ID     sandbox inbox id (required when sandbox is on)
 *   EMAIL_FROM            required when driver is "mailtrap",
 *                         e.g. 'StartupVerse <noreply@your-domain>'
 *   PUBLIC_APP_URL        used by callers to build invite / magic-link URLs
 *
 * `sendEmail` never throws — callers fire-and-forget. Failures are logged
 * and surfaced via the returned `{ sent, mode, error? }` envelope.
 */
import { MailtrapClient } from "mailtrap";
import { logger } from "../config/logger.js";

const VALID_DRIVERS = new Set(["mailtrap", "log"]);

let mailtrapClient = null;
let warnedAboutMissingFrom = false;

export function resolveEmailDriver() {
  const explicit = String(process.env.EMAIL_DRIVER || "").trim().toLowerCase();
  if (VALID_DRIVERS.has(explicit)) return explicit;
  if (process.env.MAILTRAP_API_TOKEN) return "mailtrap";
  return "log";
}

export function isEmailDeliveryEnabled() {
  return resolveEmailDriver() === "mailtrap";
}

function envFlag(name) {
  return ["1", "true", "yes", "on"].includes(
    String(process.env[name] || "")
      .trim()
      .toLowerCase(),
  );
}

function parseSandboxInboxId() {
  const raw = String(process.env.MAILTRAP_INBOX_ID || "").trim();
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isFinite(id) ? id : undefined;
}

function getMailtrapClient() {
  if (mailtrapClient) return mailtrapClient;

  const sandbox = envFlag("MAILTRAP_USE_SANDBOX");
  const testInboxId = parseSandboxInboxId();

  mailtrapClient = new MailtrapClient({
    token: process.env.MAILTRAP_API_TOKEN,
    sandbox,
    ...(sandbox && testInboxId ? { testInboxId } : {}),
  });
  return mailtrapClient;
}

/** @param {string} raw e.g. `Acme <noreply@acme.com>` or `noreply@acme.com` */
export function parseEmailAddress(raw) {
  const s = String(raw || "").trim();
  const match = s.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, "");
    return { name: name || undefined, email: match[2].trim() };
  }
  return { email: s };
}

function normaliseRecipients(to) {
  if (!to) return [];
  return Array.isArray(to) ? to.filter(Boolean).map(String) : [String(to)];
}

function tagsToCustomVariables(tags) {
  if (!Array.isArray(tags) || !tags.length) return undefined;
  const vars = {};
  for (const tag of tags) {
    if (tag?.name) vars[String(tag.name)] = String(tag.value ?? "");
  }
  return Object.keys(vars).length ? vars : undefined;
}

/**
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 * @param {string} [opts.from]
 * @param {string} [opts.replyTo]
 * @param {Array<{ name: string, value: string }>} [opts.tags]
 * @returns {Promise<{ sent: boolean, mode: "mailtrap"|"log"|"skipped", id?: string, error?: string }>}
 */
export async function sendEmail(opts) {
  const {
    to,
    subject,
    html = "",
    text = "",
    from,
    replyTo,
    tags,
  } = opts || {};

  const recipients = normaliseRecipients(to);
  if (recipients.length === 0 || !subject) {
    logger.warn("emailService.skip", {
      reason: "missing to or subject",
      hasTo: recipients.length > 0,
      hasSubject: Boolean(subject),
    });
    return { sent: false, mode: "skipped", error: "missing to or subject" };
  }

  const driver = resolveEmailDriver();

  if (driver === "log") {
    logger.info("emailService.log_only", {
      to: recipients,
      subject,
      text: text?.slice?.(0, 200) || "",
      tags,
    });
    return { sent: false, mode: "log" };
  }

  const sender = (from || process.env.EMAIL_FROM || "").trim();
  if (!sender) {
    if (!warnedAboutMissingFrom) {
      logger.warn("emailService.missing_from", {
        note: "EMAIL_FROM is not configured; mailtrap driver cannot send. Falling back to log.",
      });
      warnedAboutMissingFrom = true;
    }
    logger.info("emailService.log_only", {
      to: recipients,
      subject,
      text: text?.slice?.(0, 200) || "",
      reason: "EMAIL_FROM not configured",
    });
    return {
      sent: false,
      mode: "skipped",
      error: "EMAIL_FROM not configured",
    };
  }

  if (envFlag("MAILTRAP_USE_SANDBOX") && !parseSandboxInboxId()) {
    const message = "MAILTRAP_INBOX_ID is required when MAILTRAP_USE_SANDBOX is enabled";
    logger.error("emailService.send_failed", { to: recipients, subject, error: message });
    return { sent: false, mode: "mailtrap", error: message };
  }

  try {
    const client = getMailtrapClient();
    const payload = {
      from: parseEmailAddress(sender),
      to: recipients.map((email) => ({ email })),
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(replyTo ? { reply_to: parseEmailAddress(replyTo) } : {}),
      ...(tagsToCustomVariables(tags)
        ? { custom_variables: tagsToCustomVariables(tags) }
        : {}),
    };
    const result = await client.send(payload);
    if (result?.success === false) {
      const errMsg =
        Array.isArray(result?.errors) && result.errors.length
          ? result.errors.join("; ")
          : "Mailtrap send failed";
      logger.error("emailService.send_failed", {
        to: recipients,
        subject,
        error: errMsg,
      });
      return { sent: false, mode: "mailtrap", error: errMsg };
    }
    const id = result?.message_ids?.[0];
    logger.info("emailService.sent", {
      to: recipients,
      subject,
      id,
      tags,
      sandbox: envFlag("MAILTRAP_USE_SANDBOX"),
    });
    return { sent: true, mode: "mailtrap", ...(id ? { id } : {}) };
  } catch (err) {
    const message = err?.message || String(err);
    logger.error("emailService.send_failed", {
      to: recipients,
      subject,
      error: message,
    });
    return { sent: false, mode: "mailtrap", error: message };
  }
}

// Test seam: reset memoised client / warnings between smoke runs.
export function __resetEmailServiceForTests() {
  mailtrapClient = null;
  warnedAboutMissingFrom = false;
}
