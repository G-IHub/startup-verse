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
  leading = null,
  className,
  titleClassName,
  descriptionClassName,
  /** page = in-content header; appBar = top utility row inside AppLayoutHybrid */
  variant = "page",
}) {
  const isAppBar = variant === "appBar";
  const titleClass = cn(
    isAppBar
      ? "truncate font-heading text-sm font-bold text-text-heading"
      : "truncate text-headline-large",
    titleClassName,
  );
  const descriptionClass = cn(
    isAppBar
      ? "truncate font-body text-xs text-text-body"
      : "mt-1 text-body-medium text-muted-foreground",
    descriptionClassName,
  );
  const TitleTag = isAppBar ? "p" : "h1";

  return (
    <div
      className={cn(
        isAppBar
          ? "flex w-full items-center gap-3 py-2"
          : [
              "flex flex-col gap-3 border-b border-border/70 bg-background/80 py-3 sm:py-4",
              "sm:flex-row sm:items-center sm:justify-between",
            ],
        className,
      )}
    >
      {leading}
      {title || description ? (
        <div className="min-w-0">
          {title ? <TitleTag className={titleClass}>{title}</TitleTag> : null}
          {description ? <p className={descriptionClass}>{description}</p> : null}
        </div>
      ) : null}
      {isAppBar ? <div className="flex-1" aria-hidden="true" /> : null}
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
