import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "../ui/utils";

export const PROGRAM_CARD =
  "rounded-card border border-surface-border bg-surface-card shadow-soft";

export const PROGRAM_ROW =
  "rounded-input border border-surface-border/80 bg-surface-page/60 px-4 py-3 transition-colors duration-200 hover:border-primary/30 hover:bg-primary-tint/30";

export function ProgramPanelShell({
  icon: Icon,
  title,
  description,
  children,
  className,
  actions,
  contentClassName,
}) {
  return (
    <Card className={cn(PROGRAM_CARD, className)}>
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
      <CardContent
        className={cn("space-y-3 px-4 py-4 md:px-5 md:py-5", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}

export function ProgramEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center px-2 py-6 text-center">
      {Icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-tint text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      <p className="font-heading text-sm font-semibold text-text-heading">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm font-body text-xs leading-relaxed text-text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
