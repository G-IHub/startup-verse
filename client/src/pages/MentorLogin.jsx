/**
 * MENTOR LOGIN - Magic link authentication for mentors
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { UserPlus, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import MentorPortal from "../components/mentor/MentorPortal";
export default function MentorLogin() {
  const [verifying, setVerifying] = useState(false);
  const [mentor, setMentor] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    // Prevent multiple initializations
    if (initialized) return;
    setInitialized(true);

    // Check for existing session first
    const storedSession = localStorage.getItem("mentor_session");
    if (storedSession) {
      try {
        const mentorData = JSON.parse(storedSession);
        setMentor(mentorData);
        return; // Don't check URL token if we have a session
      } catch (error) {
        localStorage.removeItem("mentor_session");
      }
    }

    // Get token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      verifyToken(token);
    }
  }, [initialized]);
  const verifyToken = async (token) => {
    try {
      setVerifying(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/verify/${token}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid or expired token");
      }
      const data = await response.json();
      setMentor(data.mentor);

      // Store mentor session
      localStorage.setItem("mentor_session", JSON.stringify(data.mentor));
      toast.success(`Welcome back, ${data.mentor.name}!`);
    } catch (error) {
      console.error("Error verifying token:", error);
      toast.error(error.message || "Failed to verify login link");
    } finally {
      setVerifying(false);
    }
  };
  const handleRequestLink = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    try {
      setRequesting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/request-link`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send link");
      }
      toast.success("Magic link sent! Check your email.");
      setEmail("");
      setShowRequestForm(false);
    } catch (error) {
      console.error("Error requesting link:", error);
      toast.error(error.message || "Failed to send magic link");
    } finally {
      setRequesting(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("mentor_session");
    setMentor(null);
    toast.success("Logged out successfully");
  };

  // If mentor is logged in, show portal
  if (mentor) {
    return <MentorPortal mentor={mentor} onLogout={handleLogout} />;
  }

  // Login/verification screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">
            🎯 StartupVerse
          </h1>
          <p className="text-sm text-muted-foreground">Mentor Portal</p>
        </div>
        {verifying ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm">Verifying your login...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Mentor Login
              </CardTitle>
              <CardDescription className="text-xs">
                Access your mentor portal using the magic link sent to your
                email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showRequestForm ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-medium mb-1">
                          Check Your Email
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          If you were invited as a mentor, you should have
                          received a magic link in your email. Click that link
                          to access your portal.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowRequestForm(true)}
                    variant="outline"
                    className="w-full gap-2"
                    size="sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Request a New Link
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestLink} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Your Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mentor@example.com"
                      required={true}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={requesting}
                      className="flex-1 gap-2"
                      size="sm"
                    >
                      {requesting ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Magic Link
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRequestForm(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
              <div className="pt-4 border-t">
                <p className="text-[9px] text-muted-foreground text-center">
                  💡 Magic links expire after 7 days. Contact your organization
                  admin if you need help accessing your portal.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <h3 className="text-[11px] font-semibold mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              As a Mentor, You Can:
            </h3>
            <ul className="text-[9px] text-muted-foreground space-y-1">
              <li>• View all founders in your assigned cohorts</li>
              <li>• Join Virtual Office calls with founders</li>
              <li>• Access founder startup information and progress</li>
              <li>• Provide guidance and mentorship</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
