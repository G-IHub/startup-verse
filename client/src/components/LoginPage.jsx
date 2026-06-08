import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api/authApi";
import GoogleAuthButton from "./auth/GoogleAuthButton";
import {
  AuthSplitLayout,
  AuthFormCard,
  AuthDivider,
  AuthField,
  authBtnPrimary,
  authFieldClass,
} from "./auth/AuthPrimitives";

export default function LoginPage({ onRoleSelect, onNavigateToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleAuthenticated = (authResult) => {
    const user = authResult.user;
    onRoleSelect(user.role, {
      method: "google",
      fullName: user.name,
      email: user.email,
      userId: user.id || user._id,
      backendUser: user,
    });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const authResult = await authApi.signin({ email, password });
      const user = authResult.user;
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
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-md">
        <AuthFormCard
          icon={LogIn}
          title="Sign In"
          description="Access your StartupVerse account"
        >
          <GoogleAuthButton
            disabled={loading}
            onAuthenticated={handleGoogleAuthenticated}
          />
          <AuthDivider />
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <AuthField id="email" label="Email">
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={authFieldClass}
              />
            </AuthField>
            <AuthField id="password" label="Password">
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={authFieldClass}
              />
            </AuthField>
            <Button
              type="submit"
              className={`w-full ${authBtnPrimary}`}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="pt-2 text-center">
            <p className="font-body text-sm text-text-muted">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="font-semibold text-primary hover:underline"
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          </div>
          <p className="pt-1 text-center font-body text-xs text-text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </AuthFormCard>
      </div>
    </AuthSplitLayout>
  );
}
