import React from "react";
import { cn } from "../ui/utils";

export function PageViewport({ children, className }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/70 bg-background/80 py-3 sm:py-4",
        "sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-headline-large">{title}</h1>
        {description ? (
          <p className="mt-1 text-body-medium text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageSection({ children, className }) {
  return <section className={cn("py-3 sm:py-4", className)}>{children}</section>;
}

export function OverviewTemplate({ header, children }) {
  return (
    <>
      {header}
      <PageSection>{children}</PageSection>
    </>
  );
}

export function WorkspaceTemplate({ header, children }) {
  return (
    <>
      {header}
      <PageSection className="pb-0">{children}</PageSection>
    </>
  );
}

export function ListDetailTemplate({ header, children }) {
  return (
    <>
      {header}
      <PageSection>{children}</PageSection>
    </>
  );
}

export function SettingsTemplate({ header, children }) {
  return (
    <>
      {header}
      <PageSection>{children}</PageSection>
    </>
  );
}

export function MobileActionDock({ children }) {
  if (!children) return null;
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2">{children}</div>
    </div>
  );
}

