import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { toast } from "sonner";
import { authApi } from "../../api/authApi";
import {
  AuthFormCard,
  AuthGoogleButton,
  AuthDivider,
  AuthField,
  authBtnPrimary,
  authFieldClass,
  getAuthRoleContent,
} from "./AuthPrimitives";

export default function AuthSignupForm({
  role,
  onSignup,
  compact = false,
  showTerms = true,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const roleContent = getAuthRoleContent(role);
  const RoleIcon = roleContent.icon;

  const handleGoogleSignup = () => {
    toast.info("Google signup is temporarily unavailable. Please use email signup.");
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setLoading(true);
    try {
      const authResult = await authApi.signup({
        email,
        password,
        fullName,
        role,
      });
      const user = authResult.user;
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
      toast.error(error.message || "Signup failed");
      setLoading(false);
    }
  };

  return (
    <AuthFormCard
      icon={RoleIcon}
      title={roleContent.title}
      description={roleContent.description}
      compact={compact}
    >
      <AuthGoogleButton onClick={handleGoogleSignup} disabled={loading} compact={compact} />
      <AuthDivider compact={compact} />
      <form onSubmit={handleEmailSignup} className="space-y-3">
        <AuthField id="fullName" label="Full Name">
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
            className={authFieldClass}
          />
        </AuthField>
        <AuthField id="signup-email" label="Email">
          <Input
            id="signup-email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className={authFieldClass}
          />
        </AuthField>
        <AuthField id="signup-password" label="Password">
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            placeholder="Choose a password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            className={authFieldClass}
          />
        </AuthField>
        <Button
          type="submit"
          className={`w-full ${authBtnPrimary}`}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
      {showTerms ? (
        <p className="pt-1 text-center font-body text-xs text-text-muted">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      ) : null}
    </AuthFormCard>
  );
}
