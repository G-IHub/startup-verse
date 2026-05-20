import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Mail, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { post } from "../utils/backendClient.js";

/**
 * Email Setup Prompt — Mailtrap SMTP (server/.env)
 */
export default function EmailSetupPrompt() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const envelope = await post("/emails/test", {});
      const data = envelope?.data || {};
      setIsConfigured(Boolean(data.sent));
      setStatusMessage(data.message || "");
    } catch (error) {
      console.error("Failed to check email configuration:", error);
    }
  };

  if (isConfigured) {
    return null;
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <CardTitle>Email (Mailtrap SMTP) setup</CardTitle>
        </div>
        <CardDescription>
          Cohort invites and notifications are sent via SMTP configured on the API
          server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Server configuration required</AlertTitle>
          <AlertDescription>
            Add Mailtrap SMTP credentials to{" "}
            <code className="bg-muted px-1 rounded">server/.env</code> and restart
            the API. Cohort invitation emails are sent automatically when an org
            admin invites a founder.
          </AlertDescription>
        </Alert>

        {statusMessage && (
          <Alert>
            <AlertDescription className="text-sm">{statusMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold mb-2 text-foreground">
              Step 1: Mailtrap sandbox inbox
            </h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Open{" "}
                <a
                  href="https://mailtrap.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  mailtrap.io
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and create a sandbox inbox.
              </li>
              <li>Copy SMTP credentials (host, port, username, password).</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-foreground">
              Step 2: server/.env
            </h4>
            <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
{`EMAIL_TRANSPORT=smtp
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
EMAIL_FROM=StartupVerse <noreply@startupverse.test>
PUBLIC_APP_URL=http://localhost:3000`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-foreground">Step 3: Restart API</h4>
            <p>
              Restart the Node server, then sign in and use{" "}
              <code className="bg-muted px-1 rounded">POST /emails/test</code> or
              send a cohort invite to verify messages appear in Mailtrap.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          This prompt hides automatically once SMTP sends successfully.
        </p>
      </CardContent>
    </Card>
  );
}
