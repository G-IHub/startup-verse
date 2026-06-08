import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const CARD_CLASS =
  "h-full rounded-card border border-surface-border bg-surface-card shadow-soft";

export function OrganizationWidgetShell({
  icon: Icon,
  title,
  description,
  badge,
  loading,
  empty,
  children,
  footer,
}) {
  return (
    <Card className={CARD_CLASS}>
      <CardHeader className="space-y-1 border-b border-surface-border/60 px-4 pb-3 pt-4 md:px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-heading text-sm font-extrabold text-text-heading md:text-[15px]">
                {title}
              </CardTitle>
              {description ? (
                <CardDescription className="mt-0.5 font-body text-xs text-text-muted">
                  {description}
                </CardDescription>
              ) : null}
            </div>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 md:px-5 md:py-5">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-input border border-surface-border/60 bg-surface-page p-3">
                <div className="mb-2 h-3 w-2/3 rounded bg-surface-border/80" />
                <div className="h-2.5 w-1/2 rounded bg-surface-border/60" />
              </div>
            ))}
          </div>
        ) : empty ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center px-2 py-2 text-center">
            {empty.icon ? (
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-page text-text-muted">
                <empty.icon className="h-5 w-5" aria-hidden />
              </div>
            ) : null}
            <p className="font-heading text-xs font-semibold text-text-heading md:text-sm">
              {empty.title}
            </p>
            {empty.description ? (
              <p className="mt-1 max-w-[240px] font-body text-[11px] leading-relaxed text-text-muted md:text-xs">
                {empty.description}
              </p>
            ) : null}
          </div>
        ) : (
          children
        )}
        {footer && !loading && !empty ? (
          <div className="mt-3 border-t border-surface-border/60 pt-3">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OrganizationWidgetItem({ className = "", children, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full rounded-input border border-surface-border bg-surface-page p-3 text-left transition-colors duration-200 ease-in-out hover:border-primary/30 hover:bg-primary-tint/30 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}
