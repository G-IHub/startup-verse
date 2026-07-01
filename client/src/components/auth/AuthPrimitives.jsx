import React from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Rocket, Star, Building } from "lucide-react";
import { cn } from "../ui/utils";
import AuthMarketingPanel from "./AuthMarketingPanel";
import {
  SETTINGS_CARD,
  settingsBtnPrimary,
  settingsBtnOutline,
} from "../settings/SettingsPrimitives";

export const AUTH_CARD = SETTINGS_CARD;
export const authBtnPrimary = settingsBtnPrimary;
export const authBtnOutline = settingsBtnOutline;
export const authBtnAccent =
  "rounded-input bg-accent font-body text-sm font-semibold text-white shadow-[0_4px_16px_rgba(124,77,255,0.22)] transition-colors duration-200 ease-in-out hover:bg-accent-dark [&_svg]:text-white";

export const authFieldClass =
  "h-10 rounded-input border-surface-border bg-surface-page font-body text-sm text-text-body";

export const authLabelClass = "font-body text-sm text-text-heading";

export const AUTH_CALLOUT =
  "rounded-input border border-primary/20 bg-primary-tint p-4";

export function AuthPageShell({ children, className }) {
  return (
    <div
      className={cn(
        "min-h-screen min-h-[100dvh] bg-surface-page font-body",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthSplitLayout({
  children,
  marketingBreakpoint = "md",
  formClassName,
}) {
  const flexDir = marketingBreakpoint === "lg" ? "lg:flex" : "md:flex";
  const formWidth =
    marketingBreakpoint === "lg" ? "lg:w-[58%]" : "md:w-[58%]";

  return (
    <AuthPageShell className={cn(flexDir, "items-stretch")}>
      <AuthMarketingPanel breakpoint={marketingBreakpoint} />
      <div
        className={cn(
          "flex w-full min-w-0 min-h-[100dvh] items-center justify-center overflow-y-auto p-4 md:p-8",
          formWidth,
          formClassName,
        )}
      >
        {children}
      </div>
    </AuthPageShell>
  );
}

export function AuthSplitLayoutInline({ marketing, children, formClassName }) {
  return (
    <AuthPageShell className="lg:flex lg:items-stretch">
      {marketing}
      <div
        className={cn(
          "flex w-full min-w-0 min-h-[100dvh] items-center justify-center overflow-y-auto p-4 md:p-8 lg:w-[58%]",
          formClassName,
        )}
      >
        {children}
      </div>
    </AuthPageShell>
  );
}

export function AuthFormCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  compact = false,
}) {
  return (
    <Card className={cn(AUTH_CARD, "w-full max-w-md", className)}>
      <CardHeader
        className={cn(
          "border-b border-surface-border/60 text-center",
          compact ? "px-4 pb-3 pt-4" : "px-6 pb-4 pt-5",
        )}
      >
        {Icon ? (
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
        <CardTitle className="font-heading text-xl font-extrabold text-text-heading">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="mt-1 font-body text-sm text-text-muted">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-3", compact ? "px-4 py-4" : "px-6 py-5")}>
        {children}
      </CardContent>
    </Card>
  );
}

export function AuthGoogleButton({ onClick, disabled, className, size = "default" }) {
  const h = size === "compact" ? "h-9 text-sm" : "h-10 text-sm";
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full", h, authBtnOutline, className)}
      onClick={onClick}
      disabled={disabled}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
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
  );
}

export function AuthDivider({ compact = false }) {
  return (
    <div className={cn("relative", compact ? "my-3" : "my-4")}>
      <Separator className="bg-surface-border" />
      <span
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-card px-2 font-body text-text-muted",
          compact ? "text-[10px]" : "text-xs",
        )}
      >
        or
      </span>
    </div>
  );
}

export function AuthField({ id, label, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={authLabelClass}>
        {label}
      </Label>
      {children}
    </div>
  );
}

const ROLE_META = {
  founder: {
    icon: Rocket,
    iconClass: "bg-primary-tint text-primary",
  },
  talent: {
    icon: Star,
    iconClass: "bg-primary-tint text-primary",
  },
  "organization-admin": {
    icon: Building,
    iconClass: "bg-accent-tint text-accent",
  },
};

export function getAuthRoleContent(role) {
  if (role === "founder") {
    return {
      title: "Create Founder Account",
      description: "Start building your startup today",
      ...ROLE_META.founder,
    };
  }
  if (role === "talent") {
    return {
      title: "Create Talent Account",
      description: "Join exciting startup opportunities",
      ...ROLE_META.talent,
    };
  }
  return {
    title: "Create Organization Account",
    description: "Manage startup cohorts & programs",
    ...ROLE_META["organization-admin"],
  };
}

export function getOnboardingRoleContent(role) {
  const meta = ROLE_META[role] || ROLE_META.founder;
  if (role === "founder") {
    return {
      description: "Tell us about your startup to get personalized guidance",
      ...meta,
    };
  }
  if (role === "talent") {
    return {
      description:
        "Tell us who you are and what you do — you can add the rest from your profile later.",
      ...meta,
    };
  }
  return {
    description: "Set up your organization profile",
    ...meta,
  };
}

export function AuthRoleIcon({ role, className }) {
  const meta = ROLE_META[role] || ROLE_META.founder;
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg",
        meta.iconClass,
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </div>
  );
}

export function AuthCenteredShell({ children, maxWidth = "max-w-md", className }) {
  return (
    <AuthPageShell
      className={cn(
        "flex min-h-[100dvh] justify-center overflow-y-auto p-4 md:p-8",
        className,
      )}
    >
      <div className={cn("my-auto w-full py-6", maxWidth)}>{children}</div>
    </AuthPageShell>
  );
}

// Direct import for ChooseYourPath (inline marketing panel)
export { default as AuthMarketingPanel } from "./AuthMarketingPanel";
