/**
 * Email Helper Utilities
 * Helper functions for sending emails via backend
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Check if email service is configured
 */
export async function checkEmailConfiguration() {
  try {
    const response = await fetch(`${API_URL}/emails/test`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    });
    const data = await response.json();
    return data.configured === true;
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
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
📧 EMAIL SETUP REQUIRED

To send team invitation emails, you need to configure Resend API:

1. Go to https://resend.com and sign up (FREE - 100 emails/day)
2. Create an API key in your dashboard
3. Configure backend environment variable: RESEND_API_KEY = your_api_key
4. Redeploy your backend service
6. Reload StartupVerse

See /EMAIL_SYSTEM_COMPLETE.md for detailed instructions.
  `.trim();
}

export default {
  checkEmailConfiguration,
  sendTeamInvitationEmail,
  sendNotificationEmail,
  sendWelcomeEmail,
  getEmailSetupInstructions,
};
