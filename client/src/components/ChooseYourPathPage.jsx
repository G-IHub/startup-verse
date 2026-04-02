import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import ThemeToggle from "./ThemeToggle";
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
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-20 w-16 h-16 rounded-full bg-white" />
          <div className="absolute bottom-1/3 right-32 w-12 h-12 rounded-full bg-white" />
          <div className="absolute top-1/3 right-16 w-8 h-8 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 lg:p-12 text-white">
          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6 text-white" />
              <span className="text-lg font-semibold">StartupVerse</span>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-16 text-center text-white">
            Welcome!
          </h1>
          <div className="mb-8 relative overflow-hidden w-full max-w-sm h-32">
            {features.map((feature, index) => {
              const isActive = currentSlide === index;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center ${isActive && !isExiting ? "translate-x-0 opacity-100 transition-all duration-[2000ms] ease-out" : isActive && isExiting ? "-translate-x-full opacity-0 transition-all duration-[2000ms] ease-in" : "translate-x-full opacity-0 transition-none"}`}
                >
                  {index === 0 && (
                    <svg
                      width="128"
                      height="128"
                      viewBox="0 0 128 128"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        stroke="white"
                        strokeWidth="3"
                        opacity="0.6"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="40"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.4"
                        fill="none"
                      />
                      <path
                        d="M64 24 L72 56 L56 56 L64 24Z"
                        fill="white"
                        opacity="0.9"
                      />
                      <path
                        d="M64 104 L56 72 L72 72 L64 104Z"
                        fill="white"
                        opacity="0.9"
                      />
                      <path
                        d="M24 64 L56 56 L56 72 L24 64Z"
                        fill="white"
                        opacity="0.8"
                      />
                      <path
                        d="M104 64 L72 72 L72 56 L104 64Z"
                        fill="white"
                        opacity="0.8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="12"
                        fill="white"
                        opacity="0.95"
                      />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg
                      width="128"
                      height="128"
                      viewBox="0 0 128 128"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r="16"
                        fill="white"
                        opacity="0.9"
                      />
                      <circle
                        cx="88"
                        cy="40"
                        r="16"
                        fill="white"
                        opacity="0.9"
                      />
                      <circle
                        cx="64"
                        cy="88"
                        r="16"
                        fill="white"
                        opacity="0.9"
                      />
                      <line
                        x1="48"
                        y1="48"
                        x2="58"
                        y2="78"
                        stroke="white"
                        strokeWidth="3"
                        opacity="0.7"
                      />
                      <line
                        x1="80"
                        y1="48"
                        x2="70"
                        y2="78"
                        stroke="white"
                        strokeWidth="3"
                        opacity="0.7"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="10"
                        fill="white"
                        opacity="0.3"
                      />
                      <circle
                        cx="88"
                        cy="40"
                        r="10"
                        fill="white"
                        opacity="0.3"
                      />
                      <circle
                        cx="64"
                        cy="88"
                        r="10"
                        fill="white"
                        opacity="0.3"
                      />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg
                      width="128"
                      height="128"
                      viewBox="0 0 128 128"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="20"
                        y="30"
                        width="88"
                        height="60"
                        rx="4"
                        fill="white"
                        opacity="0.9"
                      />
                      <rect
                        x="24"
                        y="34"
                        width="80"
                        height="52"
                        fill="rgba(58, 90, 254, 0.3)"
                      />
                      <circle
                        cx="48"
                        cy="60"
                        r="10"
                        fill="white"
                        opacity="0.8"
                      />
                      <circle
                        cx="80"
                        cy="60"
                        r="10"
                        fill="white"
                        opacity="0.8"
                      />
                      <rect
                        x="52"
                        y="94"
                        width="24"
                        height="4"
                        fill="white"
                        opacity="0.7"
                      />
                      <rect
                        x="44"
                        y="98"
                        width="40"
                        height="6"
                        fill="white"
                        opacity="0.7"
                      />
                      <path
                        d="M48 70 Q48 75 42 78"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.6"
                        fill="none"
                      />
                      <path
                        d="M80 70 Q80 75 86 78"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.6"
                        fill="none"
                      />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg
                      width="128"
                      height="128"
                      viewBox="0 0 128 128"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="30"
                        y="50"
                        width="20"
                        height="50"
                        fill="white"
                        opacity="0.8"
                      />
                      <rect
                        x="54"
                        y="35"
                        width="20"
                        height="65"
                        fill="white"
                        opacity="0.85"
                      />
                      <rect
                        x="78"
                        y="20"
                        width="20"
                        height="80"
                        fill="white"
                        opacity="0.9"
                      />
                      <path
                        d="M20 100 L108 100"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                      <path
                        d="M40 45 L64 30 L88 15"
                        stroke="#2ECC71"
                        strokeWidth="4"
                        opacity="0.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="40"
                        cy="45"
                        r="4"
                        fill="#2ECC71"
                        opacity="0.9"
                      />
                      <circle
                        cx="64"
                        cy="30"
                        r="4"
                        fill="#2ECC71"
                        opacity="0.9"
                      />
                      <circle
                        cx="88"
                        cy="15"
                        r="4"
                        fill="#2ECC71"
                        opacity="0.9"
                      />
                      <path
                        d="M88 15 L83 20 L88 20 L88 15"
                        fill="#2ECC71"
                        opacity="0.9"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
          <div
            className="text-center mb-12 relative overflow-hidden w-full max-w-md"
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
                  <h2 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-white/90 leading-relaxed">
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
      <div className="w-full lg:w-[58%] flex items-start justify-center p-4 md:p-8 relative overflow-y-auto max-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg my-auto">
          {view === "choose-path" && (
            <>
              <div className="text-center mb-8 relative">
                <h1 className="text-2xl md:text-3xl mb-2">Choose Your Path</h1>
                <p className="text-muted-foreground text-sm">
                  Select the option that fits you best
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
                  <Card className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2.5 mb-3">
                        <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center shrink-0">
                          <Rocket className="w-4.5 h-4.5 text-background" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-base font-semibold">
                            I'm a Founder
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Build and scale your startup
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Post your startup idea</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Find talented team members</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Turn vision into team execution</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Virtual office & collaboration</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 h-8 text-xs"
                        onClick={() => handleRoleClick("founder")}
                      >
                        Create Founder Account
                        <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2.5 mb-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Star className="w-4.5 h-4.5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-base font-semibold">
                            I'm Looking to Join
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Find exciting startup opportunities
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Browse startup opportunities</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Connect with founders</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Showcase your skills</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Join innovative teams</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 h-8 text-xs"
                        onClick={() => handleRoleClick("talent")}
                      >
                        Create Talent Account
                        <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <div className="max-w-2xl mx-auto mt-6">
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors text-center list-none flex items-center justify-center gap-2">
                      <Building className="w-3.5 h-3.5" />
                      <span>
                        Are you an accelerator, competition, or program?
                      </span>
                      <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    </summary>
                    <Card className="border-2 hover:shadow-lg transition-all mt-3">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2.5 mb-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                            <Building className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-base font-semibold">
                              Organization Admin
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Manage startup cohorts & programs
                            </p>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>Create and manage cohorts</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>Invite startups to your program</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>Monitor real-time execution progress</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>Export reports for stakeholders</span>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-4 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleRoleClick("organization-admin")}
                        >
                          Create Organization Account
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          For accelerators, competitions, university programs,
                          and more
                        </p>
                      </CardContent>
                    </Card>
                  </details>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-6">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
                <div className="text-center mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="h-8 px-3 text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </>
          )}
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
