import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { authApi } from "../../api/authApi";
import { AuthGoogleButton } from "./AuthPrimitives";
import { cn } from "../ui/utils";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function googleErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("sign up first")) {
    return "No account exists for this Google email. Please sign up first.";
  }
  if (message.includes("not configured")) {
    return "Google sign-in is not configured yet.";
  }
  if (message.includes("verified")) {
    return "Your Google email must be verified before sign-in.";
  }
  return message || "Google sign-in failed. Please try again.";
}

export default function GoogleAuthButton({
  role,
  disabled = false,
  compact = false,
  onAuthenticated,
}) {
  const [loading, setLoading] = useState(false);
  const size = compact ? "compact" : "default";

  if (!googleClientId) {
    return (
      <AuthGoogleButton
        size={size}
        disabled={disabled}
        onClick={() => toast.error("Google sign-in is not configured yet.")}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex w-full justify-center overflow-hidden",
        disabled || loading ? "pointer-events-none opacity-60" : "",
        compact ? "min-h-9" : "min-h-10",
      )}
      aria-busy={loading}
    >
      <GoogleLogin
        width="400"
        size={compact ? "medium" : "large"}
        shape="rectangular"
        theme="outline"
        text="continue_with"
        onSuccess={async (credentialResponse) => {
          const credential = credentialResponse?.credential;
          if (!credential) {
            toast.error("Google did not return a sign-in credential.");
            return;
          }
          setLoading(true);
          try {
            const authResult = await authApi.google({ credential, role });
            onAuthenticated?.(authResult);
          } catch (error) {
            toast.error(googleErrorMessage(error));
          } finally {
            setLoading(false);
          }
        }}
        onError={() => {
          toast.error("Google sign-in was cancelled or failed.");
        }}
      />
    </div>
  );
}
