/**
 * GOOGLE ACCOUNT CONNECTION COMPONENT
 * Allows users to connect their Google account for auto-generating Google Meet links
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { unwrapData } from "../../utils/apiEnvelope";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export default function GoogleAccountConnect({ userId, userType }) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [integrationOff, setIntegrationOff] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  useEffect(() => {
    checkConnectionStatus();
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleParam = params.get("google");
    if (!googleParam) return;

    if (googleParam === "connected") {
      toast.success("Google account connected successfully");
      checkConnectionStatus();
    } else if (googleParam === "error") {
      toast.error("Google connection failed", {
        description: params.get("message") || "Please try again.",
      });
    }

    params.delete("google");
    params.delete("message");
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState({}, "", next);
  }, []);
  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/google/status/${userId}`,
        defaultOptions,
      );
      if (!response.ok) throw new Error("Failed to check status");
      const payload = await response.json();
      const data = unwrapData(payload) || {};
      const enabled = data.enabled === true;
      const placeholder = data.placeholder === true;
      const unavailable = !enabled || placeholder;
      setIntegrationOff(unavailable);
      setStatusMessage(
        data.message ||
          (placeholder
            ? "Google OAuth is not available on this server yet."
            : ""),
      );
      setConnected(Boolean(data.connected) && enabled && !placeholder);
      setEmail(data.email || "");
    } catch (error) {
      console.error("Error checking Google connection status:", error);
    } finally {
      setLoading(false);
    }
  };
  const connectGoogle = () => {
    if (integrationOff) {
      toast.error(
        statusMessage || "Google OAuth is not available on this server yet.",
      );
      return;
    }
    setConnecting(true);
    window.location.href = `${API_BASE_URL}/google/connect`;
  };
  const disconnectGoogle = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/google/disconnect/${userId}`,
        {
          ...defaultOptions,
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Failed to disconnect");
      setConnected(false);
      setEmail("");
      toast.success("Google account disconnected");
    } catch (error) {
      console.error("Error disconnecting Google account:", error);
      toast.error("Failed to disconnect Google account");
    }
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Calendar Integration
        </CardTitle>
        <CardDescription className="text-xs">
          Connect your Google account to auto-generate Google Meet links for all
          meetings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {integrationOff ? (
          <p className="text-sm text-muted-foreground">
            {statusMessage ||
              "Google Calendar integration is disabled. Administrators can enable it when OAuth is configured."}
          </p>
        ) : connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                  Connected
                </p>
                <p className="text-[10px] text-green-700 dark:text-green-300 truncate">
                  {email}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Google Meet links auto-generated for all meetings</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Calendar events created automatically</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Attendees notified via Google Calendar</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectGoogle}
              className="w-full gap-2"
            >
              <X className="w-4 h-4" />
              Disconnect Google Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-gray-300 rounded-sm mt-0.5 flex-shrink-0" />
                <span>Auto-generate Google Meet links</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-gray-300 rounded-sm mt-0.5 flex-shrink-0" />
                <span>Automatic calendar integration</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-gray-300 rounded-sm mt-0.5 flex-shrink-0" />
                <span>Professional meeting experience</span>
              </div>
            </div>
            <Button
              onClick={connectGoogle}
              disabled={connecting}
              className="w-full gap-2 bg-[#4285F4] hover:bg-[#4285F4]/90"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Connect Google Account
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              We'll only access your calendar to create meeting events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
