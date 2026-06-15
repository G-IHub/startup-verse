import { cn } from "../ui/utils";

export const callShell = {
  root: "relative flex h-full w-full flex-col gap-2 bg-surface-page p-2",
  header: "flex shrink-0 items-center justify-between gap-2 px-2 py-2",
  headerTitle: "font-heading text-base font-semibold text-text-heading sm:text-lg",
  headerSubtitle: "font-body text-xs text-text-muted sm:text-sm",
  participantPill:
    "inline-flex items-center rounded-pill border border-surface-border bg-surface-card px-2.5 py-1 font-body text-xs font-medium text-text-heading shadow-soft",
  bodyRow: "flex min-h-0 flex-1 flex-col gap-2 pb-20 md:flex-row",
  stageCard:
    "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface-card shadow-soft",
  sidePanelCard:
    "hidden min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl bg-surface-card shadow-soft md:flex w-full md:w-[min(380px,40vw)] md:min-w-[320px]",
  stage: "relative flex min-h-0 flex-1 flex-col bg-primary-tint/20",
  stageOverlay:
    "absolute inset-0 z-10 flex items-center justify-center bg-surface-page/80 font-body text-sm text-text-heading backdrop-blur-sm",
  controlFloat:
    "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-2 pb-4",
  controlBar:
    "pointer-events-auto inline-flex items-center gap-2 rounded-pill border border-surface-border/80 bg-surface-card/95 px-3 py-2 shadow-card backdrop-blur-md",
  controlIconBtn: cn(
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-surface-page text-text-body",
    "transition-all duration-200 hover:bg-primary-tint hover:text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
    "active:scale-95",
  ),
  controlIconBtnActive:
    "border-accent/25 bg-accent-tint text-accent hover:bg-accent-tint hover:text-accent",
  controlIconBtnMuted:
    "border-status-error/20 bg-status-error/10 text-status-error hover:bg-status-error/15 hover:text-status-error",
  controlIconBtnShareActive:
    "border-accent/25 bg-accent-tint text-accent hover:bg-accent-tint hover:text-accent",
  endCallBtn: cn(
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-status-error text-white shadow-soft",
    "transition-all duration-200 hover:bg-status-error/90 active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/35",
  ),
  sidePanel: "flex min-h-0 flex-1 flex-col",
  sidePanelHeader: "shrink-0 border-b border-surface-border/60 px-3 pt-3",
  sidePanelBody: "min-h-0 flex-1 overflow-hidden bg-surface-page/50",
  chatBanner:
    "border-b border-primary/15 bg-primary-tint px-3 py-2 font-body text-xs text-primary",
  chatList: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-surface-page/50 px-2 py-2",
  chatInputFooter: "shrink-0 border-t border-surface-border/60 bg-surface-card p-2",
  chatInputRow: "flex items-end gap-2",
  chatTextInput: cn(
    "min-h-[40px] flex-1 resize-none rounded-input border border-surface-border bg-surface-page px-3 py-2",
    "font-body text-sm text-text-heading placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
  ),
  chatSendBtn: cn(
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white",
    "transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50",
  ),
};

export function chatBubbleClass(isLocal) {
  return cn(
    "max-w-[85%] px-3.5 py-2.5 font-body text-sm leading-relaxed",
    isLocal
      ? "ml-auto rounded-2xl rounded-br-md bg-primary text-white"
      : "rounded-2xl rounded-bl-md border border-surface-border bg-surface-card text-text-heading shadow-soft",
  );
}

export function chatMetaClass(isLocal) {
  return cn(
    "mb-1 flex items-center gap-2 px-1 font-body text-[11px]",
    isLocal ? "justify-end text-text-muted" : "text-text-muted",
  );
}

export function participantCardClass() {
  return cn(
    "flex items-center gap-2 rounded-2xl border border-surface-border bg-surface-page p-2 shadow-soft",
    "transition-all duration-200 hover:border-primary/20 hover:shadow-card",
  );
}

export function participantListClass() {
  return "flex flex-col gap-2 p-2";
}

export function statusDotClass(variant = "offline") {
  const colors = {
    "in-call": "bg-accent",
    online: "bg-status-success",
    offline: "bg-text-muted/50",
  };
  return cn("h-2 w-2 shrink-0 rounded-full", colors[variant] || colors.offline);
}

export function tileClass({ isSpeaking = false, compact = false, isMain = false } = {}) {
  return cn(
    "relative overflow-hidden bg-slate-900",
    compact ? "rounded-xl" : "rounded-2xl",
    isMain ? "h-full w-full" : "aspect-video w-full",
    isSpeaking && "ring-2 ring-accent ring-offset-2 ring-offset-surface-card",
  );
}

export function tileAvatarOffClass(compact = false) {
  return cn(
    "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary-tint/40 p-4",
    compact && "p-2",
  );
}

export function avatarFallbackClass(compact = false) {
  return cn(
    "flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-heading font-semibold text-white shadow-card",
    compact ? "h-10 w-10 text-sm" : "h-20 w-20 text-xl sm:h-24 sm:w-24 sm:text-2xl",
  );
}

export function rosterAvatarClass() {
  return cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
    "bg-gradient-to-br from-primary to-accent font-heading text-sm font-semibold text-white shadow-soft",
  );
}

export function participantBadgeClass() {
  return cn(
    "absolute bottom-2 left-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5",
    "rounded-pill bg-black/40 px-2.5 py-1 backdrop-blur-md",
  );
}

export function tileNameLabelClass() {
  return cn(
    "absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-pill bg-black/40 px-2 py-0.5",
    "font-body text-[10px] font-medium text-white backdrop-blur-md",
  );
}

export function gridContainerClass() {
  return "grid h-full w-full gap-2 p-2";
}

export function spotlightMainClass() {
  return "flex min-h-0 min-w-0 flex-1 p-2";
}

export function spotlightFilmstripClass() {
  return cn(
    "flex shrink-0 gap-2 overflow-x-auto p-2 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto",
    "max-h-[28%] sm:max-h-none sm:w-[140px] md:w-[180px]",
  );
}

export function filmstripTileClass() {
  return "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900 sm:h-auto sm:w-full sm:aspect-video";
}
