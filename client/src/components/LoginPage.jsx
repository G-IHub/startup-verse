import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import ThemeToggle from "./ThemeToggle";
import { Building, Users, Zap, Video, LogIn } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api/authApi";
export default function LoginPage({ onRoleSelect, onNavigateToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const isMountedRef = useRef(true);

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
  const handleGoogleLogin = () => {
    toast.info("Google sign-in is temporarily unavailable. Please use email sign-in.");
  };
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      // Call backend signin API
      const authResult = await authApi.signin({
        email,
        password,
      });
      const user = authResult.user;
      console.log("✅ [LoginPage] Backend signin successful:", user);

      // Pass user data back to App.tsx
      onRoleSelect(user.role, {
        method: "email",
        fullName: user.name,
        email: user.email,
        password,
        userId: user.id,
        backendUser: user,
        backendToken: authResult.token,
      });
    } catch (error) {
      const errorMessage = error.message;
      toast.error(errorMessage);
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-[42%] bg-primary relative overflow-hidden">
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
      <div className="w-full md:w-[58%] flex items-center justify-center p-4 md:p-8 bg-background relative">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <Card className="w-full shadow-none border-none bg-transparent">
            <CardHeader className="text-center pb-3 pt-4 px-6">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center mx-auto mb-2 shadow-lg">
                <LogIn className="w-5 h-5 text-background" />
              </div>
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription className="mt-1 text-sm">
                Access your StartupVerse account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-4">
              <Button
                variant="outline"
                className="w-full h-9 shadow-sm hover:shadow-md transition-shadow text-sm"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                Continue with Google
              </Button>
              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={true}
                    disabled={loading}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={true}
                    disabled={loading}
                    className="h-10"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 shadow-sm hover:shadow-md transition-shadow text-sm"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="text-primary hover:underline font-medium"
                    disabled={loading}
                  >
                    Sign up
                  </button>
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
