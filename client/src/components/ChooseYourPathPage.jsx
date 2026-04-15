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
  Users,
  Zap,
  Video,
} from "lucide-react";
import InlineSignupForm from "./InlineSignupForm";
import InlineProfileCompletion from "./InlineProfileCompletion";
export default function ChooseYourPathPage({ onBack, onComplete }) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const isMountedRef = useRef(true);
  const [view, setView] = useState("choose-path");

  // Features carousel data
  const features = [
    {
      icon: Zap,
      title: "7-Step Weekly Execution",
      description:
        "Ship faster with our proven weekly framework. Set objectives, execute daily, review outcomes, and progress through startup stages automatically.",
    },
    {
      icon: Users,
      title: "Smart Team Matching",
      description:
        "Build your dream team with AI-powered matching. Connect with co-founders, developers, designers, and marketers who share your vision.",
    },
    {
      icon: Video,
      title: "Virtual Office & Collaboration",
      description:
        "Work together in real-time with integrated video calls, messaging, and shared workspaces. Your startup office, anywhere.",
    },
    {
      icon: Building,
      title: "Accelerator Programs",
      description:
        "Join cohorts, track progress, and get mentorship. Organizations can monitor teams and export real-time execution reports.",
    },
  ];

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Carousel animation sequence
  useEffect(() => {
    let stayTimer = null;
    let exitTimer = null;

    // Step 1: Stay visible for 3500ms (3.5 seconds for reading)
    stayTimer = setTimeout(() => {
      if (!isMountedRef.current) return;

      // Step 2: Start exit animation (only if still mounted)
      if (isMountedRef.current) {
        setIsExiting(true);
      }

      // Step 3: After exit completes (2000ms), move to next slide
      exitTimer = setTimeout(() => {
        if (!isMountedRef.current) return;

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setCurrentSlide((prev) => (prev + 1) % features.length);
          setIsExiting(false);
        }
      }, 2000);
    }, 3500);

    // Cleanup both timers and prevent any pending state updates
    return () => {
      if (stayTimer) clearTimeout(stayTimer);
      if (exitTimer) clearTimeout(exitTimer);
      stayTimer = null;
      exitTimer = null;
    };
  }, [currentSlide, features.length]);
  const handleRoleClick = (role) => {
    if (!isMountedRef.current) return;
    setSelectedRole(role);
    setShowSignupModal(true);
    setView("signup");
  };
  const handleSignup = (role, data) => {
    if (!isMountedRef.current) return;

    // Close signup modal and show profile setup
    setShowSignupModal(false);

    // Extract user from signup data
    let user;
    if (data.backendUser) {
      // User from backend authentication
      user = data.backendUser;
    } else {
      // Fallback: Create user from signup data (Google auth)
      user = {
        id: data.userId || `user-${Date.now()}`,
        name: data.fullName || data.email?.split("@")[0] || "New User",
        email: data.email || "",
        role: role,
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        profile: {},
      };
    }
    if (!isMountedRef.current) return;
    setNewUser(user);
    setSelectedRole(role);
    setShowProfileSetup(true);
    setView("profile-setup");
  };
  const handleProfileComplete = (profileData) => {
    if (!isMountedRef.current) return;

    // Complete the entire flow - navigate to dashboard
    // The onUpdateUser callback should have already updated newUser with complete profile
    if (selectedRole && newUser) {
      // Mark onboarding as complete
      const completedUser = {
        ...newUser,
        onboardingComplete: true,
      };
      onComplete(selectedRole, completedUser);
    }
  };
  const handleProfileUpdateUser = (updatedUser) => {
    if (!isMountedRef.current) return;
    // Update the local user state as profile is being filled out
    setNewUser(updatedUser);
  };
  const handleSignupModalClose = () => {
    if (!isMountedRef.current) return;
    setShowSignupModal(false);
    setSelectedRole(null);
    setView("choose-path");
  };
  const handleProfileSetupClose = () => {
    if (!isMountedRef.current) return;
    setShowProfileSetup(false);
    setNewUser(null);
    setSelectedRole(null);
    setView("choose-path");
  };

  const fullWidthOnboarding =
    view === "signup" || view === "profile-setup";

  if (fullWidthOnboarding) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col items-stretch">
        <div className="flex-1 w-full flex justify-center px-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-14 sm:px-8 sm:pt-16 md:px-8 md:py-10 md:pb-10">
          <div className="w-full max-w-3xl my-auto">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background lg:flex">
      <div className="hidden lg:flex lg:w-[42%] bg-primary relative overflow-hidden border-r border-primary/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-20 w-16 h-16 rounded-full bg-white" />
          <div className="absolute bottom-1/3 right-32 w-12 h-12 rounded-full bg-white" />
          <div className="absolute top-1/3 right-16 w-8 h-8 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-10 lg:p-14 text-white">
          <div className="absolute top-8 left-10">
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6 text-white" />
              <span className="text-lg font-semibold">StartupVerse</span>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-14 text-center text-white tracking-tight">
            Welcome!
          </h1>
          <div className="mb-8 relative overflow-hidden w-full max-w-sm h-32">
            {features.map((feature, index) => {
              const isActive = currentSlide === index;
              const SlideIcon = feature.icon;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center ${isActive && !isExiting ? "translate-x-0 opacity-100 transition-all duration-[2000ms] ease-out" : isActive && isExiting ? "-translate-x-full opacity-0 transition-all duration-[2000ms] ease-in" : "translate-x-full opacity-0 transition-none"}`}
                >
                  <SlideIcon
                    className="h-24 w-24 text-white drop-shadow-md sm:h-28 sm:w-28"
                    strokeWidth={1.35}
                    aria-hidden
                  />
                </div>
              );
            })}
          </div>
          <div
            className="text-center mb-10 relative overflow-hidden w-full max-w-md"
            style={{
              minHeight: "140px",
            }}
          >
            {features.map((feature, index) => {
              const isActive = currentSlide === index;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 ${isActive && !isExiting ? "translate-x-0 opacity-100 transition-all duration-[2000ms] ease-out" : isActive && isExiting ? "-translate-x-full opacity-0 transition-all duration-[2000ms] ease-in" : "translate-x-full opacity-0 transition-none"}`}
                >
                  <h2 className="text-xl font-semibold mb-3 text-white tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-white/90 leading-relaxed max-w-sm mx-auto">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${currentSlide === index ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/40"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="relative flex w-full max-h-[100dvh] items-start justify-center overflow-y-auto px-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-14 sm:px-8 sm:pt-16 md:max-h-screen md:px-8 md:py-10 md:pb-10 lg:w-[58%] lg:px-10 lg:py-10">
        <div className="my-auto w-full max-w-2xl md:max-w-6xl">
          {view === "choose-path" && (
            <>
              <header className="relative mb-12 text-center md:mb-14">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                  Choose Your Path
                </h1>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:mt-4 md:text-base">
                  Select the option that fits you best
                </p>
              </header>
              <div className="flex flex-col gap-14 md:gap-10">
                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
                  <Card className="rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-black/[0.04] transition-all duration-200 dark:bg-card/95 dark:ring-white/[0.06] hover:shadow-lg active:scale-[0.99] md:bg-card/95 md:shadow-sm md:ring-0 md:hover:shadow-md md:hover:-translate-y-0.5">
                    <CardContent className="flex flex-col px-6 pt-8 pb-14 sm:px-7 md:px-6 md:pt-7 md:pb-10">
                      <div className="mb-5 flex items-center space-x-3 md:mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Rocket className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-base md:text-lg font-semibold tracking-tight">
                            I'm a Founder
                          </h4>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            Build and scale your startup
                          </p>
                        </div>
                      </div>
                      <Separator className="my-6 shrink-0 md:my-5" />
                      <div className="space-y-4 md:space-y-3.5">
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Post your startup idea</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Find talented team members</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Turn vision into team execution</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Virtual office & collaboration</span>
                        </div>
                      </div>
                      <div className="mt-12 flex shrink-0 justify-center md:mt-9 md:block">
                        <Button
                          className="h-12 w-full max-w-sm rounded-xl px-6 text-base shadow-sm transition-shadow hover:shadow-md md:max-w-none md:rounded-lg md:px-5 md:h-11 md:text-sm"
                          onClick={() => handleRoleClick("founder")}
                        >
                          Create Founder Account
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-black/[0.04] transition-all duration-200 dark:bg-card/95 dark:ring-white/[0.06] hover:shadow-lg active:scale-[0.99] md:bg-card/95 md:shadow-sm md:ring-0 md:hover:shadow-md md:hover:-translate-y-0.5">
                    <CardContent className="flex flex-col px-6 pt-8 pb-14 sm:px-7 md:px-6 md:pt-7 md:pb-10">
                      <div className="mb-5 flex items-center space-x-3 md:mb-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-base md:text-lg font-semibold tracking-tight">
                            I'm Looking to Join
                          </h4>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            Find exciting startup opportunities
                          </p>
                        </div>
                      </div>
                      <Separator className="my-6 shrink-0 md:my-5" />
                      <div className="space-y-4 md:space-y-3.5">
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Browse startup opportunities</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Connect with founders</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Showcase your skills</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                          <span>Join innovative teams</span>
                        </div>
                      </div>
                      <div className="mt-12 flex shrink-0 justify-center md:mt-9 md:block">
                        <Button
                          className="h-12 w-full max-w-sm rounded-xl px-6 text-base shadow-sm transition-shadow hover:shadow-md md:max-w-none md:rounded-lg md:px-5 md:h-11 md:text-sm"
                          onClick={() => handleRoleClick("talent")}
                        >
                          Create Talent Account
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mx-auto w-full max-w-2xl md:max-w-6xl">
                  <details className="group rounded-xl py-2">
                    <summary className="mx-auto flex max-w-md cursor-pointer list-none flex-wrap items-center justify-center gap-x-2 gap-y-2 px-2 py-4 text-center text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground md:py-3">
                      <Building className="w-3.5 h-3.5" />
                      <span>
                        Are you an accelerator, competition, or program?
                      </span>
                      <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    </summary>
                    <Card className="mt-6 rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-black/[0.04] transition-all hover:shadow-lg dark:bg-card/95 dark:ring-white/[0.06] md:mt-5 md:bg-card/95 md:shadow-sm md:ring-0 md:hover:shadow-md">
                      <CardContent className="flex flex-col px-6 pt-8 pb-14 sm:px-7 md:px-6 md:pt-7 md:pb-10">
                        <div className="mb-5 flex items-center space-x-3 md:mb-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                            <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-base md:text-lg font-semibold tracking-tight">
                              Organization Admin
                            </h4>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              Manage startup cohorts & programs
                            </p>
                          </div>
                        </div>
                        <Separator className="my-6 shrink-0 md:my-5" />
                        <div className="space-y-4 md:space-y-3.5">
                          <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                            <span>Create and manage cohorts</span>
                          </div>
                          <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                            <span>Invite startups to your program</span>
                          </div>
                          <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                            <span>Monitor real-time execution progress</span>
                          </div>
                          <div className="flex items-start gap-3 text-sm leading-relaxed md:items-center md:gap-2.5 md:leading-snug">
                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0 md:h-3.5 md:w-3.5" />
                            <span>Export reports for stakeholders</span>
                          </div>
                        </div>
                        <div className="mt-12 flex shrink-0 justify-center md:mt-9 md:block">
                          <Button
                            className="h-12 w-full max-w-sm rounded-xl bg-purple-600 px-6 text-base shadow-sm transition-shadow hover:bg-purple-700 hover:shadow-md md:max-w-none md:rounded-lg md:px-5 md:h-11 md:text-sm"
                            onClick={() => handleRoleClick("organization-admin")}
                          >
                            Create Organization Account
                            <ArrowRight className="w-3.5 h-3.5 ml-2" />
                          </Button>
                        </div>
                        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground md:mt-4">
                          For accelerators, competitions, university programs,
                          and more
                        </p>
                      </CardContent>
                    </Card>
                  </details>
                </div>
                <p className="mx-auto max-w-md text-center text-xs leading-relaxed text-muted-foreground">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="h-11 px-6 text-sm md:h-10 md:px-5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
