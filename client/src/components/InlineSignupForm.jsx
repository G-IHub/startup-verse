import React from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import AuthSignupForm from "./auth/AuthSignupForm";
import { authBtnOutline } from "./auth/AuthPrimitives";

export default function InlineSignupForm({ role, onBack, onSignup }) {
  return (
    <div className="w-full animate-in fade-in slide-in-from-right duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className={`mb-3 h-8 px-3 text-xs ${authBtnOutline}`}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back
      </Button>
      <AuthSignupForm role={role} onSignup={onSignup} />
    </div>
  );
}
