import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";

export const SETTINGS_CARD =
  "rounded-card border border-surface-border bg-surface-card shadow-soft";

export const settingsBtnPrimary =
  "rounded-input bg-primary font-body text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white";

export const settingsBtnOutline =
  "rounded-input border border-surface-border bg-surface-card font-body text-sm font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint hover:text-primary [&_svg]:text-current";

export const settingsBtnDangerOutline =
  "rounded-input border border-status-error/40 bg-surface-card font-body text-sm font-semibold text-status-error shadow-none transition-colors duration-200 ease-in-out hover:border-status-error hover:bg-status-error/8 hover:text-status-error";

export const settingsBtnDanger =
  "rounded-input border-0 bg-status-error font-body text-sm font-semibold text-white shadow-[0_4px_16px_rgba(255,79,107,0.25)] transition-colors duration-200 ease-in-out hover:bg-status-error/90 [&_svg]:text-white";

export function SettingsPanelCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  actions,
}) {
  return (
    <Card className={cn(SETTINGS_CARD, className)}>
      <CardHeader className="space-y-1 border-b border-surface-border/60 px-4 pb-3 pt-4 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {Icon ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
            ) : null}
            <div className="min-w-0">
              <CardTitle className="font-heading text-base font-extrabold text-text-heading md:text-[17px]">
                {title}
              </CardTitle>
              {description ? (
                <CardDescription className="mt-0.5 font-body text-xs text-text-muted md:text-sm">
                  {description}
                </CardDescription>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 md:px-5 md:py-5">{children}</CardContent>
    </Card>
  );
}

export function SettingsFieldGrid({ children, cols = 2, className }) {
  return (
    <div
      className={cn(
        "grid gap-2",
        cols === 2 && "md:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SettingsField({ label, htmlFor, children, className, fullWidth }) {
  return (
    <div
      className={cn(
        "rounded-input border border-surface-border bg-surface-page px-4 py-3",
        fullWidth && "md:col-span-2",
        className,
      )}
    >
      <Label
        htmlFor={htmlFor}
        className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted"
      >
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function SettingsGroup({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      {title ? (
        <div className="flex items-center gap-2 px-0.5 pb-0.5">
          {Icon ? <Icon className="h-4 w-4 text-primary" aria-hidden /> : null}
          <h3 className="font-heading text-sm font-extrabold text-text-heading">{title}</h3>
        </div>
      ) : null}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function SettingsToggleRow({
  id,
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-input border border-surface-border bg-surface-page px-4 py-3.5 transition-colors duration-200 hover:border-primary/20">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0">
          <Label
            htmlFor={id}
            className="cursor-pointer font-heading text-sm font-semibold text-text-heading"
          >
            {title}
          </Label>
          {description ? (
            <p className="mt-0.5 font-body text-xs leading-relaxed text-text-muted md:text-[13px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
        aria-label={title}
      />
    </div>
  );
}

const ICON_TINT = {
  primary: "bg-primary-tint text-primary",
  success: "bg-emerald-50 text-emerald-600",
  neutral: "bg-surface-page text-text-muted ring-1 ring-surface-border",
  danger: "bg-status-error/10 text-status-error",
};

export function SettingsActionRow({
  icon: Icon,
  iconTint = "primary",
  title,
  description,
  children,
  danger,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-input border bg-surface-page p-4 sm:flex-row sm:items-center sm:justify-between",
        danger ? "border-status-error/25" : "border-surface-border",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            ICON_TINT[iconTint] || ICON_TINT.primary,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3
            className={cn(
              "font-heading text-sm font-extrabold",
              danger ? "text-status-error" : "text-text-heading",
            )}
          >
            {title}
          </h3>
          <p className="mt-1 font-body text-xs leading-relaxed text-text-body md:text-sm">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
    </div>
  );
}
