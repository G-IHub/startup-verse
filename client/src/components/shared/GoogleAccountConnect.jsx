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
import { getAccessToken } from "../../app/session";

export default function GoogleAccountConnect({ userId, userType }) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    checkConnectionStatus();
  }, [userId]);
  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/google/status/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to check status");
      const data = await response.json();
      setConnected(data.connected);
      setEmail(data.email || "");
    } catch (error) {
      console.error("Error checking Google connection status:", error);
    } finally {
      setLoading(false);
    }
  };
  const connectGoogle = async () => {
    try {
      setConnecting(true);

      // Get authorization URL
      const response = await fetch(
        `${API_BASE_URL}/google/oauth/authorize?userId=${userId}&userType=${userType}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OAuth authorize failed:", response.status, errorText);
        throw new Error(
          `Failed to initiate OAuth: ${response.status} - ${errorText}`,
        );
      }
      const data = await response.json();
      if (!data.authUrl) {
        console.error("No authUrl in response:", data);
        throw new Error("No authorization URL received from server");
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        data.authUrl,
        "Google OAuth",
        `width=${width},height=${height},left=${left},top=${top}`,
      );
      if (!popup) {
        throw new Error(
          "Failed to open popup window. Please allow popups for this site.",
        );
      }

      // Poll for popup close
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Check status after popup closes
          setTimeout(() => {
            checkConnectionStatus();
            setConnecting(false);
          }, 1000);
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        if (popup && !popup.closed) {
          popup.close();
        }
        setConnecting(false);
      }, 300000);
    } catch (error) {
      console.error("Error connecting Google account:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to connect Google account",
      );
      setConnecting(false);
    }
  };
  const disconnectGoogle = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/google/disconnect/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
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
        {connected ? (
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
