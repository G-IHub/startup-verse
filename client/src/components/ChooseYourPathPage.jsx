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
import AuthMarketingPanel from "./auth/AuthMarketingPanel";
import StartupVerseLogo from "./brand/StartupVerseLogo";
import {
  AUTH_CARD,
  AuthPageShell,
  AuthCenteredShell,
  authBtnPrimary,
  authBtnAccent,
  authBtnOutline,
} from "./auth/AuthPrimitives";
import { cn } from "./ui/utils";

const PATH_CARD = cn(
  AUTH_CARD,
  "min-w-0 overflow-hidden transition-all duration-200 hover:shadow-card active:scale-[0.99] md:hover:-translate-y-0.5",
);

const PATH_CARD_CONTENT = "flex min-h-0 flex-col px-6 pt-8 pb-6 sm:px-7 md:px-6 md:pt-7";

const PATH_BTN = cn(
  authBtnPrimary,
  "h-11 w-full min-w-0 whitespace-normal text-center leading-snug sm:h-12 lg:h-11",
);

const PATH_BTN_ACCENT = cn(
  authBtnAccent,
  "h-11 w-full min-w-0 whitespace-normal text-center leading-snug sm:h-12 lg:h-11",
);

const CONTENT_COLUMN =
  "relative flex w-full min-w-0 max-h-[100dvh] items-start justify-center overflow-y-auto px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-14 sm:px-6 sm:pt-16 md:px-8 md:py-10 md:pb-10 lg:min-h-[100dvh] lg:w-[58%] lg:px-10 lg:py-10";

function MobileLogoHeader() {
  return (
    <div className="mb-8 flex justify-center lg:hidden">
      <StartupVerseLogo className="h-8" />
    </div>
  );
}

export default function ChooseYourPathPage({ onBack, onComplete, onPersistUser }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const isMountedRef = useRef(true);
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
    const accessToken = data.backendToken || "";
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
    onPersistUser?.(user);
    onComplete(role, { ...user, onboardingComplete: false }, accessToken);
  };

  const handleSignupModalClose = () => {
    if (!isMountedRef.current) return;
    setSelectedRole(null);
    setView("choose-path");
  };

  if (view === "signup") {
    return (
      <AuthCenteredShell>
        <MobileLogoHeader />
        {selectedRole ? (
          <InlineSignupForm
            role={selectedRole}
            onBack={handleSignupModalClose}
            onSignup={handleSignup}
          />
        ) : null}
      </AuthCenteredShell>
    );
  }

  return (
    <AuthPageShell className="lg:flex lg:items-stretch">
      <AuthMarketingPanel breakpoint="lg" />
      <div className={CONTENT_COLUMN}>
        <div className="my-auto w-full max-w-2xl md:max-w-6xl">
          <MobileLogoHeader />
          <header className="relative mb-10 text-center md:mb-12">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-heading sm:text-3xl md:text-4xl">
              Choose Your Path
            </h1>
            <p className="mt-3 text-pretty font-body text-sm leading-relaxed text-text-muted md:mt-4 md:text-base">
              Select the option that fits you best
            </p>
          </header>
          <div className="flex flex-col gap-10 md:gap-8">
            <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6 lg:grid-cols-1 2xl:grid-cols-2 2xl:gap-x-10">
              <Card className={PATH_CARD}>
                <CardContent className={PATH_CARD_CONTENT}>
                  <div className="mb-5 flex items-center space-x-3 md:mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
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
                  <div className="mt-auto flex shrink-0 justify-center pt-6">
                    <Button
                      className={PATH_BTN}
                      onClick={() => handleRoleClick("founder")}
                    >
                      Create Founder Account
                      <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className={PATH_CARD}>
                <CardContent className={PATH_CARD_CONTENT}>
                  <div className="mb-5 flex items-center space-x-3 md:mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
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
                  <div className="mt-auto flex shrink-0 justify-center pt-6">
                    <Button
                      className={PATH_BTN}
                      onClick={() => handleRoleClick("talent")}
                    >
                      Create Talent Account
                      <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mx-auto w-full min-w-0 max-w-2xl md:max-w-6xl">
              <details className="group rounded-card py-2">
                <summary className="mx-auto flex max-w-md cursor-pointer list-none flex-wrap items-center justify-center gap-x-2 gap-y-2 px-2 py-4 text-center font-body text-sm leading-snug text-text-muted transition-colors hover:text-text-heading md:py-3">
                  <Building className="h-3.5 w-3.5" />
                  <span>Are you an accelerator, competition, or program?</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                </summary>
                <Card className={cn(PATH_CARD, "mt-6 md:mt-5")}>
                  <CardContent className={PATH_CARD_CONTENT}>
                    <div className="mb-5 flex items-center space-x-3 md:mb-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint">
                        <Building className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0 text-left">
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
                    <div className="mt-auto flex shrink-0 justify-center pt-6">
                      <Button
                        className={PATH_BTN_ACCENT}
                        onClick={() => handleRoleClick("organization-admin")}
                      >
                        Create Organization Account
                        <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" />
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
