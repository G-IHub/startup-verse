/**
 * Email Helper Utilities
 * Helper functions for sending emails via backend
 */

import { API_BASE_URL } from "../config/apiBase.js";

const API_URL = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Check if email service is configured
 */
export async function checkEmailConfiguration() {
  try {
    const response = await fetch(`${API_URL}/emails/test`, {
      ...defaultOptions,
    });
    const data = await response.json();
    const inner = data?.data ?? data;
    return inner?.configured === true || inner?.sent === true;
  } catch (error) {
    console.error("Failed to check email configuration:", error);
    return false;
  }
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(params) {
  try {
    console.log("📧 Sending team invitation email to:", params.toEmail);

    const response = await fetch(`${API_URL}/emails/send-invitation`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to send invitation email:", data);
      return { success: false, error: data.error || "Failed to send email" };
    }

    console.log("✅ Invitation email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending invitation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(params) {
  try {
    console.log("📧 Sending notification email to:", params.toEmail);

    const response = await fetch(`${API_URL}/emails/send-notification`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to send notification email:", data);
      return { success: false, error: data.error || "Failed to send email" };
    }

    console.log("✅ Notification email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending notification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(params) {
  try {
    console.log("📧 Sending welcome email to:", params.toEmail);

    const response = await fetch(`${API_URL}/emails/send-welcome`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to send welcome email:", data);
      return { success: false, error: data.error || "Failed to send email" };
    }

    console.log("✅ Welcome email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get email setup instructions
 */
export function getEmailSetupInstructions() {
  return `
📧 EMAIL SETUP (Mailtrap SMTP)

1. Create a Mailtrap sandbox inbox at https://mailtrap.io
2. Copy SMTP host, port, username, and password
3. Add to server/.env:
   EMAIL_TRANSPORT=smtp
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=...
   SMTP_PASS=...
   EMAIL_FROM=StartupVerse <noreply@startupverse.test>
   PUBLIC_APP_URL=http://localhost:3000
4. Restart the API server

Cohort invites send email automatically from the server when an org admin invites a founder.
  `.trim();
}

export default {
  checkEmailConfiguration,
  sendTeamInvitationEmail,
  sendNotificationEmail,
  sendWelcomeEmail,
  getEmailSetupInstructions,
};
