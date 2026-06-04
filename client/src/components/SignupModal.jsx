import React from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import AuthSignupForm from "./auth/AuthSignupForm";

export default function SignupModal({ role, onClose, onSignup }) {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center p-2 duration-200 sv-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="relative w-full max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-8 w-8 rounded-lg text-text-muted hover:bg-primary-tint hover:text-text-heading"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="p-1">
          <AuthSignupForm role={role} onSignup={onSignup} compact showTerms={false} />
        </div>
      </div>
    </div>
  );
}
