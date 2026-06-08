/**
 * MENTOR LOGIN - Magic link authentication for mentors
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { UserPlus, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import MentorPortal from "../components/mentor/MentorPortal";
import { unwrapData } from "../utils/apiEnvelope";
import {
  AUTH_CARD,
  AUTH_CALLOUT,
  AuthCenteredShell,
  AuthFormCard,
  authBtnPrimary,
  authBtnOutline,
  authFieldClass,
  authLabelClass,
} from "../components/auth/AuthPrimitives";

const API_BASE = API_BASE_URL;

async function fetchMentorSessionMe() {
  const response = await fetch(`${API_BASE}/mentors/public/session/me`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  const inner = unwrapData(await response.json());
  return inner?.mentor || null;
}

async function establishMentorSession(token) {
  const response = await fetch(`${API_BASE}/mentors/public/session`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Invalid or expired token");
  }
  const inner = unwrapData(await response.json());
  return inner?.mentor || null;
}

async function logoutMentorSession() {
  await fetch(`${API_BASE}/mentors/public/session/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export default function MentorLogin() {
  const [verifying, setVerifying] = useState(false);
  const [mentor, setMentor] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const run = async () => {
      try {
        const existing = await fetchMentorSessionMe();
        if (existing) {
          setMentor(existing);
          return;
        }
      } catch {
        /* ignore */
      }
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      if (token) {
        verifyToken(token);
      }
    };
    run();
  }, [initialized]);

  const verifyToken = async (token) => {
    try {
      setVerifying(true);
      const mentorDto = await establishMentorSession(token);
      setMentor(mentorDto);
      toast.success(`Welcome back, ${mentorDto.name}!`);
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
      const response = await fetch(`${API_BASE}/mentors/public/request-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
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

  const handleLogout = async () => {
    try {
      await logoutMentorSession();
    } catch {
      /* ignore */
    }
    setMentor(null);
    toast.success("Logged out successfully");
  };

  if (mentor) {
    return <MentorPortal mentor={mentor} onLogout={handleLogout} />;
  }

  return (
    <AuthCenteredShell maxWidth="max-w-md">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-heading text-2xl font-extrabold text-primary">
          StartupVerse
        </h1>
        <p className="font-body text-sm text-text-muted">Mentor Portal</p>
      </div>
      {verifying ? (
        <div className={AUTH_CARD}>
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-body text-sm text-text-body">Verifying your login...</p>
          </div>
        </div>
      ) : (
        <AuthFormCard
          icon={UserPlus}
          title="Mentor Login"
          description="Access your mentor portal using the magic link sent to your email"
        >
          {!showRequestForm ? (
            <div className="space-y-3">
              <div className={AUTH_CALLOUT}>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="mb-1 font-body text-xs font-semibold text-text-heading">
                      Check your email
                    </p>
                    <p className="font-body text-xs text-text-body">
                      If you were invited as a mentor, you should have received a
                      magic link in your email. Click that link to access your portal.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowRequestForm(true)}
                variant="outline"
                className={`w-full gap-2 ${authBtnOutline}`}
                size="sm"
              >
                <ArrowRight className="h-4 w-4" />
                Request a New Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestLink} className="space-y-3">
              <div>
                <label className={`mb-1 block ${authLabelClass}`}>Your Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@example.com"
                  required
                  className={authFieldClass}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={requesting}
                  className={`flex-1 gap-2 ${authBtnPrimary}`}
                  size="sm"
                >
                  {requesting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                  size="sm"
                  className={authBtnOutline}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
          <p className="border-t border-surface-border pt-4 text-center font-body text-[10px] text-text-muted">
            Magic links expire after 7 days. Contact your organization admin if you
            need help accessing your portal.
          </p>
        </AuthFormCard>
      )}
      <div className={`mt-4 ${AUTH_CARD}`}>
        <div className="p-4">
          <h3 className="mb-2 flex items-center gap-1 font-heading text-xs font-semibold text-text-heading">
            <CheckCircle className="h-3 w-3 text-primary" />
            As a mentor, you can:
          </h3>
          <ul className="space-y-1 font-body text-[11px] text-text-muted">
            <li>View all founders in your assigned cohorts</li>
            <li>Join Virtual Office calls with founders</li>
            <li>Access founder startup information and progress</li>
            <li>Provide guidance and mentorship</li>
          </ul>
        </div>
      </div>
    </AuthCenteredShell>
  );
}
