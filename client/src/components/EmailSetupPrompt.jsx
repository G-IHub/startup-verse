import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { PasswordInput } from "./ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Mail, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { post } from "../utils/backendClient.js";

/**
 * Email Setup Prompt
 * Guides users to set up Resend API key for email functionality
 */
export default function EmailSetupPrompt() {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    checkConfiguration();
  }, []);
  const checkConfiguration = async () => {
    try {
      const envelope = await post("/emails/test", {});
      setIsConfigured(Boolean(envelope?.data?.sent));
    } catch (error) {
      console.error("Failed to check email configuration:", error);
    }
  };
  const handleSetup = () => {
    if (!apiKey.trim()) {
      setError("Please enter your Resend API key");
      return;
    }
    setError("");
    setSuccess(
      "API key copied. Add RESEND_API_KEY to your server environment (e.g. server/.env) and restart the API.",
    );

    // Copy to clipboard
    navigator.clipboard.writeText(apiKey);
  };
  if (isConfigured) {
    return null; // Don't show if already configured
  }
  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <CardTitle>Email Service Setup Required</CardTitle>
        </div>
        <CardDescription>
          Enable team invitations and email notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Setup Needed</AlertTitle>
          <AlertDescription>
            To send team invitation emails and notifications, you need to
            configure the Resend API key.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">
              Step 1: Get your Resend API Key
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                {"Go to "}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {"resend.com "}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Sign up for a free account (100 emails/day free)</li>
              <li>Create an API key in your dashboard</li>
              <li>Copy the API key (starts with "re_")</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Step 2: Configure the API server</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Open your server environment file (for example <code className="bg-muted px-1 rounded">server/.env</code>)</li>
              <li>
                {"Set "}
                <code className="bg-muted px-1 rounded">RESEND_API_KEY</code>
                {" to your Resend key"}
              </li>
              <li>Restart the Node process so the new variable loads</li>
            </ol>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {success}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Resend API Key (for reference)
              </label>
              <PasswordInput
                autoComplete="off"
                placeholder="Paste your Resend API key (starts with re_)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleSetup} disabled={isLoading || !apiKey}>
              Copy Instructions
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Once configured, reload this page. The setup prompt will
            disappear automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
