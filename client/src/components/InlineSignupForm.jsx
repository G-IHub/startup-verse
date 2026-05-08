import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ArrowLeft, Rocket, Star, Building } from "lucide-react";
import { authApi } from "../api/authApi";
import { toast } from "sonner";
export default function InlineSignupForm({ role, onBack, onSignup }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isMountedRef = React.useRef(true);

  // Track mounted state
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const handleGoogleSignup = () => {
    toast.info("Google signup is temporarily unavailable. Please use email signup.");
  };
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      // Call backend signup API
      const authResult = await authApi.signup({
        email,
        password,
        fullName,
        role,
      });
      const user = authResult.user;
      console.log("✅ [InlineSignupForm] Backend signup successful:", user);

      // Double-check mounted state before callback
      if (!isMountedRef.current) return;

      // Pass user data back
      onSignup(role, {
        method: "email",
        fullName: user.name,
        email: user.email,
        password,
        userId: user.id,
        backendUser: user,
        backendToken: authResult.token,
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      const errorMessage = error.message;
      alert(errorMessage);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };
  const isFounder = role === "founder";
  const isTalent = role === "talent";
  const isOrganization = role === "organization-admin";

  // Get role-specific content
  const getRoleContent = () => {
    if (isFounder) {
      return {
        title: "Create Founder Account",
        description: "Start building your startup today",
        icon: <Rocket className="w-6 h-6 text-background" />,
        bgColor: "bg-foreground",
      };
    } else if (isTalent) {
      return {
        title: "Create Talent Account",
        description: "Join exciting startup opportunities",
        icon: <Star className="w-6 h-6 text-background" />,
        bgColor: "bg-foreground",
      };
    } else {
      return {
        title: "Create Organization Account",
        description: "Manage startup cohorts & programs",
        icon: (
          <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        ),
        bgColor: "bg-purple-100 dark:bg-purple-950",
      };
    }
  };
  const roleContent = getRoleContent();
  return (
    <div className="w-full animate-in fade-in slide-in-from-right duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-3 h-8 px-3 text-xs"
        disabled={loading}
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back
      </Button>
      <Card className="w-full shadow-none border-none bg-transparent">
        <CardHeader className="text-center pb-2 pt-3 px-6">
          <div
            className={`w-10 h-10 rounded-full ${roleContent.bgColor} flex items-center justify-center mx-auto mb-2 shadow-lg`}
          >
            {roleContent.icon}
          </div>
          <CardTitle className="text-xl">{roleContent.title}</CardTitle>
          <CardDescription className="mt-1 text-sm">
            {roleContent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-4">
          <Button
            variant="outline"
            className="w-full h-9 shadow-sm hover:shadow-md transition-shadow text-sm"
            onClick={handleGoogleSignup}
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
          <div className="relative my-3">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>
          <form onSubmit={handleEmailSignup} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={true}
                disabled={loading}
                className="border-border/70 h-9 text-sm"
              />
            </div>
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
                className="border-border/70 h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="Please choose a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={true}
                minLength={8}
                disabled={loading}
                className="border-border/70 h-9 text-sm"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-9 shadow-sm hover:shadow-md transition-shadow text-sm"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center pt-2">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
