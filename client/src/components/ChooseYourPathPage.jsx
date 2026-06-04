import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  ArrowLeft,
  Rocket,
  Building,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import InlineSignupForm from "./InlineSignupForm";
import InlineProfileCompletion from "./InlineProfileCompletion";
import AuthMarketingPanel from "./auth/AuthMarketingPanel";
import {
  AUTH_CARD,
  AuthPageShell,
  authBtnPrimary,
  authBtnAccent,
  authBtnOutline,
} from "./auth/AuthPrimitives";
import { cn } from "./ui/utils";

const PATH_CARD = cn(
  AUTH_CARD,
  "transition-all duration-200 hover:shadow-card active:scale-[0.99] md:hover:-translate-y-0.5",
);

export default function ChooseYourPathPage({ onBack, onComplete, onPersistUser }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [pendingAccessToken, setPendingAccessToken] = useState("");
  const isMountedRef = useRef(true);
  const latestUserRef = useRef(null);
  const [view, setView] = useState("choose-path");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRoleClick = (role) => {
    if (!isMountedRef.current) return;
    setSelectedRole(role);
    setView("signup");
  };

  const handleSignup = (role, data) => {
    if (!isMountedRef.current) return;
    setPendingAccessToken(data.backendToken || "");
    let user;
    if (data.backendUser) {
      user = data.backendUser;
    } else {
      user = {
        id: data.userId || `user-${Date.now()}`,
        name: data.fullName || data.email?.split("@")[0] || "New User",
        email: data.email || "",
        role,
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        profile: {},
      };
    }
    if (!isMountedRef.current) return;
    latestUserRef.current = user;
    setNewUser(user);
    setSelectedRole(role);
    setShowProfileSetup(true);
    setView("profile-setup");
  };

  const handleProfileComplete = () => {
    if (!isMountedRef.current) return;
    const base = latestUserRef.current ?? newUser;
    if (selectedRole && base) {
      onComplete(
        selectedRole,
        { ...base, onboardingComplete: true },
        pendingAccessToken,
      );
    }
  };

  const handleProfileUpdateUser = (updatedUser) => {
    if (!isMountedRef.current) return;
    latestUserRef.current = updatedUser;
    setNewUser(updatedUser);
    onPersistUser?.(updatedUser);
  };

  const handleSignupModalClose = () => {
    if (!isMountedRef.current) return;
    setPendingAccessToken("");
    setSelectedRole(null);
    setView("choose-path");
  };

  const handleProfileSetupClose = () => {
    if (!isMountedRef.current) return;
    latestUserRef.current = null;
    setShowProfileSetup(false);
    setNewUser(null);
    setPendingAccessToken("");
    setSelectedRole(null);
    setView("choose-path");
  };

  if (view === "signup" || view === "profile-setup") {
    return (
      <AuthPageShell className="flex flex-col items-stretch">
        <div className="flex flex-1 w-full justify-center px-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-14 sm:px-8 sm:pt-16 md:px-8 md:py-10 md:pb-10">
          <div className="my-auto w-full max-w-md">
            {view === "signup" && selectedRole && (
              <InlineSignupForm
                role={selectedRole}
                onBack={handleSignupModalClose}
                onSignup={handleSignup}
              />
            )}
            {view === "profile-setup" && newUser && selectedRole && (
              <InlineProfileCompletion
                user={newUser}
                role={selectedRole}
                onBack={handleProfileSetupClose}
                onComplete={handleProfileComplete}
                onUpdateUser={handleProfileUpdateUser}
              />
            )}
          </div>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell className="lg:flex">
      <AuthMarketingPanel breakpoint="lg" />
      <div className="relative flex w-full max-h-[100dvh] items-start justify-center overflow-y-auto px-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-14 sm:px-8 sm:pt-16 md:max-h-screen md:px-8 md:py-10 md:pb-10 lg:w-[58%] lg:px-10 lg:py-10">
        <div className="my-auto w-full max-w-2xl md:max-w-6xl">
          <header className="relative mb-12 text-center md:mb-14">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-heading sm:text-3xl md:text-4xl">
              Choose Your Path
            </h1>
            <p className="mt-3 text-pretty font-body text-sm leading-relaxed text-text-muted md:mt-4 md:text-base">
              Select the option that fits you best
            </p>
          </header>
          <div className="flex flex-col gap-14 md:gap-10">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
              <Card className={PATH_CARD}>
                <CardContent className="flex flex-col px-6 pt-8 pb-14 sm:px-7 md:px-6 md:pt-7 md:pb-10">
                  <div className="mb-5 flex items-center space-x-3 md:mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-heading text-base font-semibold tracking-tight text-text-heading md:text-lg">
                        I&apos;m a Founder
                      </h4>
                      <p className="mt-1.5 font-body text-sm text-text-muted">
                        Build and scale your startup
                      </p>
                    </div>
                  </div>
                  <Separator className="my-6 shrink-0 bg-surface-border md:my-5" />
                  <ul className="space-y-4 md:space-y-3.5">
                    {[
                      "Post your startup idea",
                      "Find talented team members",
                      "Turn vision into team execution",
                      "Virtual office & collaboration",
                    ].map((text) => (
                      <li
                        key={text}
                        className="flex items-start gap-3 font-body text-sm leading-relaxed text-text-body md:items-center md:gap-2.5 md:leading-snug"
                      >
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-text-muted md:mt-0" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-12 flex shrink-0 justify-center md:mt-9 md:block">
                    <Button
                      className={`h-12 w-full max-w-sm md:h-11 md:max-w-none ${authBtnPrimary}`}
                      onClick={() => handleRoleClick("founder")}
                    >
                      Create Founder Account
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className={PATH_CARD}>
                <CardContent className="flex flex-col px-6 pt-8 pb-14 sm:px-7 md:px-6 md:pt-7 md:pb-10">
                  <div className="mb-5 flex items-center space-x-3 md:mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-heading text-base font-semibold tracking-tight text-text-heading md:text-lg">
                        I&apos;m Looking to Join
                      </h4>
                      <p className="mt-1.5 font-body text-sm text-text-muted">
                        Find exciting startup opportunities
                      </p>
                    </div>
                  </div>
                  <Separator className="my-6 shrink-0 bg-surface-border md:my-5" />
                  <ul className="space-y-4 md:space-y-3.5">
                    {[
                      "Browse startup opportunities",
                      "Connect with founders",
                      "Showcase your skills",
                      "Join innovative teams",
                    ].map((text) => (
                      <li
                        key={text}
                        className="flex items-start gap-3 font-body text-sm leading-relaxed text-text-body md:items-center md:gap-2.5 md:leading-snug"
                      >
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-text-muted md:mt-0" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-12 flex shrink-0 justify-center md:mt-9 md:block">
                    <Button
                      className={`h-12 w-full max-w-sm md:h-11 md:max-w-none ${authBtnPrimary}`}
                      onClick={() => handleRoleClick("talent")}
                    >
                      Create Talent Account
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mx-auto w-full max-w-2xl md:max-w-6xl">
              <details className="group rounded-card py-2">
                <summary className="mx-auto flex max-w-md cursor-pointer list-none flex-wrap items-center justify-center gap-x-2 gap-y-2 px-2 py-4 text-center font-body text-sm leading-snug text-text-muted transition-colors hover:text-text-heading md:py-3">
                  <Building className="h-3.5 w-3.5" />
                  <span>Are you an accelerator, competition, or program?</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                </summary>
                <Card className={cn(PATH_CARD, "mt-6 md:mt-5")}>
                  <CardContent className="flex flex-col px-6 pt-8 pb-14 sm:px-7 md:px-6 md:pt-7 md:pb-10">
                    <div className="mb-5 flex items-center space-x-3 md:mb-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint">
                        <Building className="h-5 w-5 text-accent" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-heading text-base font-semibold tracking-tight text-text-heading md:text-lg">
                          Organization Admin
                        </h4>
                        <p className="mt-1.5 font-body text-sm text-text-muted">
                          Manage startup cohorts & programs
                        </p>
                      </div>
                    </div>
                    <Separator className="my-6 shrink-0 bg-surface-border md:my-5" />
                    <ul className="space-y-4 md:space-y-3.5">
                      {[
                        "Create and manage cohorts",
                        "Invite startups to your program",
                        "Monitor real-time execution progress",
                        "Export reports for stakeholders",
                      ].map((text) => (
                        <li
                          key={text}
                          className="flex items-start gap-3 font-body text-sm leading-relaxed text-text-body md:items-center md:gap-2.5"
                        >
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-text-muted md:mt-0" />
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-12 flex shrink-0 justify-center md:mt-9 md:block">
                      <Button
                        className={`h-12 w-full max-w-sm md:h-11 md:max-w-none ${authBtnAccent}`}
                        onClick={() => handleRoleClick("organization-admin")}
                      >
                        Create Organization Account
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-5 text-center font-body text-xs leading-relaxed text-text-muted md:mt-4">
                      For accelerators, competitions, university programs, and more
                    </p>
                  </CardContent>
                </Card>
              </details>
            </div>
            <p className="mx-auto max-w-md text-center font-body text-xs leading-relaxed text-text-muted">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy
            </p>
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className={`h-11 px-6 text-sm md:h-10 md:px-5 ${authBtnOutline}`}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
