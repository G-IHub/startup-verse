import { escapeHtml } from "./escapeHtml.js";

/**
 * Renders the mentor magic-link email body. Pure function — unit-smokeable
 * without env / network. The link is single-use until reissued by the
 * mentor controller.
 *
 * @param {Object} params
 * @param {string} [params.organizationName]
 * @param {string}  params.magicLinkUrl
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderMentorMagicLinkEmail({
  organizationName = "",
  magicLinkUrl,
} = {}) {
  if (!magicLinkUrl || typeof magicLinkUrl !== "string") {
    throw new Error("renderMentorMagicLinkEmail: magicLinkUrl is required.");
  }

  const safeOrg = escapeHtml(organizationName);
  const safeUrl = escapeHtml(magicLinkUrl);
  const orgSentence = organizationName
    ? `<strong>${safeOrg}</strong> has granted you mentor access on StartupVerse.`
    : `You've been granted mentor access on StartupVerse.`;

  const subject = "Your StartupVerse mentor access link";

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
                  Your mentor access link
                </h1>
                <p style="margin:0 0 16px 0;color:#374151;line-height:1.5;">
                  ${orgSentence}
                </p>
                <p style="margin:0 0 16px 0;color:#374151;line-height:1.5;">
                  Click the button below to sign in. The link stays valid until a new one is issued.
                </p>
                <p style="margin:24px 0;text-align:center;">
                  <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
                    Open mentor portal
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
            If you didn't request this link, you can ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    organizationName
      ? `${organizationName} has granted you mentor access on StartupVerse.`
      : `You've been granted mentor access on StartupVerse.`,
    "",
    "Open your mentor portal:",
    magicLinkUrl,
    "",
    "If you didn't request this link, you can safely ignore this email.",
    "",
    "— StartupVerse",
  ].join("\n");

  return { subject, html, text };
}
