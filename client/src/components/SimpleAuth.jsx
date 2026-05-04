import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Rocket, Chrome, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { setAdminFlag } from "../utils/adminHelpers";
export default function SimpleAuth({ role, onComplete }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const getRoleDisplayName = (role) => {
    const roleNames = {
      founder: "Founder",
      "team-member": "Team Member",
      talent: "Talent",
      mentor: "Mentor",
      investor: "Investor",
      freelancer: "Freelancer",
    };
    return roleNames[role] || role;
  };
  const handleEmailAuth = (e) => {
    e.preventDefault();
    if (!email || (!isSignup && !password) || (isSignup && !name)) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);

    // Simulate auth delay
    setTimeout(() => {
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        email: email,
        name: isSignup ? name : email.split("@")[0],
        role: role,
        onboardingComplete: true,
        // Skip old onboarding
        profile: {
          // Start with minimal profile - they'll fill this in Founder Journey
          role: getRoleDisplayName(role),
        },
      };

      // Set admin flag based on email
      const userWithAdmin = setAdminFlag(user);
      toast.success(`Welcome ${userWithAdmin.name}!`);
      onComplete(userWithAdmin);
      setIsLoading(false);
    }, 1000);
  };
  const handleGoogleAuth = () => {
    setIsLoading(true);

    // Simulate Google OAuth
    setTimeout(() => {
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        email: "user@gmail.com",
        name: "Google User",
        role: role,
        onboardingComplete: true,
        // Skip old onboarding
        profile: {
          role: getRoleDisplayName(role),
        },
      };

      // Set admin flag based on email
      const userWithAdmin = setAdminFlag(user);
      toast.success(`Welcome ${userWithAdmin.name}!`);
      onComplete(userWithAdmin);
      setIsLoading(false);
    }, 1000);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-4 md:pr-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              Welcome to StartupVerse
            </h1>
            <p className="text-lg text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              StartupVerse is the comprehensive startup ecosystem platform that
              helps founders build, execute, and scale their ventures with
              precision.
            </p>
            <p>
              Join a community of ambitious founders, talented team members, and
              experienced mentors working together to bring innovative ideas to
              life.
            </p>
            <div className="pt-2 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>
                  <strong>Smart Team Matching</strong>
                  {" - Find the perfect co-founders and team members"}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>
                  <strong>Execution Engine</strong>
                  {" - 7-step weekly framework to move fast"}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>
                  <strong>Virtual Office</strong>
                  {" - Collaborate with your team in real-time"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Card className="w-full">
            <CardHeader className="text-center space-y-1.5 pb-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">
                {isSignup ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-xs">
                {"Join StartupVerse as a "}
                <strong>{getRoleDisplayName(role)}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-0">
              <Button
                variant="outline"
                className="w-full h-9"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isSignup && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={true}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={true}
                    className="h-9 text-sm"
                  />
                </div>
                {!isSignup && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs">
                      Password
                    </Label>
                    <PasswordInput
                      id="password"
                      autoComplete="current-password"
                      placeholder="Please enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={true}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 h-9"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Please wait..."
                  ) : (
                    <>
                      {isSignup ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-xs h-8"
                >
                  {isSignup
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </Button>
              </div>
              {role === "founder" && isSignup && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <strong>What's next?</strong>
                    {
                      " After creating your account, you'll complete your founder profile (Stage 0) - takes about 5 minutes."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
