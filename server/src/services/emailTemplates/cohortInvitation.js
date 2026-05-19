import { escapeHtml } from "./escapeHtml.js";

/**
 * Renders the cohort-invitation email body. Pure function so it can be
 * unit-smoked without env / network. All interpolated values are
 * HTML-escaped — the only place we drop in raw HTML is the CTA URL,
 * which is also escaped for the `href` attribute.
 *
 * @param {Object} params
 * @param {string} [params.organizationName]
 * @param {string} [params.cohortName]
 * @param {string} [params.inviterName]
 * @param {string}  params.inviteUrl
 * @param {string} [params.message]      Optional admin note shown verbatim.
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderCohortInvitationEmail({
  organizationName = "",
  cohortName = "",
  inviterName = "",
  inviteUrl,
  message = "",
} = {}) {
  if (!inviteUrl || typeof inviteUrl !== "string") {
    throw new Error("renderCohortInvitationEmail: inviteUrl is required.");
  }

  const cohortLabel = cohortName || "a new cohort";
  const orgLabel = organizationName ? ` at ${organizationName}` : "";
  const subject = `You're invited to ${cohortLabel}`;

  const safeOrg = escapeHtml(organizationName || "an organisation");
  const safeCohort = escapeHtml(cohortLabel);
  const safeInviter = escapeHtml(inviterName || "An organisation admin");
  const safeUrl = escapeHtml(inviteUrl);
  const safeMessage = escapeHtml(message);

  const messageBlock = safeMessage
    ? `<p style="margin:16px 0;color:#374151;line-height:1.5;">
         <strong>Message from ${safeInviter}:</strong><br />${safeMessage}
       </p>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td>
                <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;">
                  You're invited to ${safeCohort}
                </h1>
                <p style="margin:0 0 16px 0;color:#374151;line-height:1.5;">
                  ${safeInviter} invited you to join <strong>${safeCohort}</strong>${orgLabel ? ` at <strong>${safeOrg}</strong>` : ""}.
                </p>
                ${messageBlock}
                <p style="margin:24px 0;text-align:center;">
                  <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
                    Accept invitation
                  </a>
                </p>
                <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;line-height:1.5;">
                  Or paste this link into your browser:<br />
                  <span style="word-break:break-all;color:#374151;">${safeUrl}</span>
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;color:#9ca3af;font-size:12px;">
            Sent by StartupVerse
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${inviterName || "An organisation admin"} invited you to join ${cohortLabel}${orgLabel}.`,
    message ? `\nMessage:\n${message}\n` : "",
    `Accept the invitation:`,
    inviteUrl,
    "",
    "— StartupVerse",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
