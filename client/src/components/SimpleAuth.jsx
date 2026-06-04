import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { ArrowRight, Rocket } from "lucide-react";
import { toast } from "sonner";
import { setAdminFlag } from "../utils/adminHelpers";
import {
  AuthPageShell,
  AuthFormCard,
  AuthGoogleButton,
  AuthDivider,
  AuthField,
  AUTH_CALLOUT,
  authBtnPrimary,
  authFieldClass,
} from "./auth/AuthPrimitives";

export default function SimpleAuth({ role, onComplete }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const getRoleDisplayName = (roleKey) => {
    const roleNames = {
      founder: "Founder",
      "team-member": "Team Member",
      talent: "Talent",
      mentor: "Mentor",
      investor: "Investor",
      freelancer: "Freelancer",
    };
    return roleNames[roleKey] || roleKey;
  };

  const finishAuth = (user) => {
    const userWithAdmin = setAdminFlag(user);
    toast.success(`Welcome ${userWithAdmin.name}!`);
    onComplete(userWithAdmin);
    setIsLoading(false);
  };

  const handleEmailAuth = (e) => {
    e.preventDefault();
    if (!email || (!isSignup && !password) || (isSignup && !name)) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      finishAuth({
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: isSignup ? name : email.split("@")[0],
        role,
        onboardingComplete: true,
        profile: { role: getRoleDisplayName(role) },
      });
    }, 1000);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      finishAuth({
        id: Math.random().toString(36).substr(2, 9),
        email: "user@gmail.com",
        name: "Google User",
        role,
        onboardingComplete: true,
        profile: { role: getRoleDisplayName(role) },
      });
    }, 1000);
  };

  return (
    <AuthPageShell className="flex items-center justify-center p-4 md:p-6">
      <div className="grid w-full max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="space-y-4 md:pr-8">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-extrabold text-text-heading md:text-4xl">
              Welcome to StartupVerse
            </h1>
            <p className="font-body text-lg text-text-muted">
              Sign in to continue to your dashboard
            </p>
          </div>
          <div className="space-y-3 font-body text-sm text-text-body">
            <p>
              StartupVerse helps founders build, execute, and scale with a proven
              weekly framework and virtual collaboration tools.
            </p>
            <ul className="space-y-2 pt-2">
              {[
                ["Smart Team Matching", "Find co-founders and team members"],
                ["Execution Engine", "7-step weekly framework to move fast"],
                ["Virtual Office", "Collaborate with your team in real-time"],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <p>
                    <strong className="text-text-heading">{title}</strong>
                    {" — "}
                    {desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AuthFormCard
          icon={Rocket}
          title={isSignup ? "Create Account" : "Welcome Back"}
          description={
            <>
              Join StartupVerse as a{" "}
              <strong className="text-text-heading">{getRoleDisplayName(role)}</strong>
            </>
          }
        >
          <AuthGoogleButton onClick={handleGoogleAuth} disabled={isLoading} />
          <AuthDivider />
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isSignup && (
              <AuthField id="name" label="Full Name">
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={authFieldClass}
                />
              </AuthField>
            )}
            <AuthField id="email" label="Email">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={authFieldClass}
              />
            </AuthField>
            {!isSignup && (
              <AuthField id="password" label="Password">
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={authFieldClass}
                />
              </AuthField>
            )}
            <Button
              type="submit"
              className={`w-full ${authBtnPrimary}`}
              disabled={isLoading}
            >
              {isLoading ? (
                "Please wait..."
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsSignup(!isSignup)}
              className="h-8 font-body text-xs text-primary"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>
          {role === "founder" && isSignup && (
            <div className={AUTH_CALLOUT}>
              <p className="font-body text-[11px] leading-snug text-text-body">
                <strong className="text-text-heading">What&apos;s next?</strong>
                {" After creating your account, you'll complete your founder profile (Stage 0) — about 5 minutes."}
              </p>
            </div>
          )}
        </AuthFormCard>
      </div>
    </AuthPageShell>
  );
}
