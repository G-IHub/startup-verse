import { cn } from "../ui/utils";

export const callShell = {
  root: "relative flex h-full min-h-0 w-full flex-col bg-surface-page",
  header:
    "flex shrink-0 items-start justify-between gap-3 border-b border-surface-border bg-surface-card px-4 py-3 sm:px-5 sm:py-4",
  headerTitle: "font-heading text-lg font-semibold leading-tight text-text-heading sm:text-xl",
  headerSubtitle:
    "mt-1.5 max-w-3xl font-body text-sm leading-relaxed text-text-muted sm:text-[15px]",
  participantPill:
    "inline-flex shrink-0 items-center rounded-pill border border-surface-border bg-surface-page px-2.5 py-1.5 font-body text-xs font-medium text-text-heading shadow-soft",
  bodyRow: "flex min-h-0 flex-1 flex-row",
  videoColumn: "flex min-h-0 min-w-0 flex-1 flex-col",
  videoMain: "flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 sm:px-4",
  stageCard:
    "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-border bg-slate-950 shadow-soft",
  controlsRow: "mt-3 flex w-full shrink-0 items-center justify-center",
  stage: "relative flex min-h-0 flex-1 flex-col bg-slate-950",
  stageOverlay:
    "absolute inset-0 z-10 flex items-center justify-center bg-surface-page/80 font-body text-sm text-text-heading backdrop-blur-sm",
  controlBar:
    "mx-auto inline-flex items-center gap-2 rounded-pill border border-surface-border/80 bg-surface-card/95 px-3 py-2 shadow-card backdrop-blur-md",
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

export function tileClass({ isSpeaking = false, compact = false, isMain = false, fillStage = false } = {}) {
  return cn(
    "relative overflow-hidden bg-slate-950",
    compact ? "rounded-xl" : "rounded-2xl",
    isMain || fillStage ? "h-full w-full" : "aspect-video w-full",
    isSpeaking && "ring-2 ring-primary ring-offset-2 ring-offset-slate-950",
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
  return "grid h-full w-full gap-1.5 p-1.5";
}

export function spotlightMainClass({ screenShare = false } = {}) {
  return cn(
    "flex min-h-0 min-w-0 flex-1",
    screenShare ? "p-1 sm:p-2" : "p-2",
  );
}

export function spotlightFilmstripClass({ screenShare = false } = {}) {
  if (screenShare) {
    return cn(
      "flex shrink-0 gap-2 overflow-x-auto border-t border-surface-border/70 bg-surface-card/95 p-2",
      "max-h-[30%] min-h-[88px] sm:min-h-[104px]",
    );
  }

  return cn(
    "flex shrink-0 gap-2 overflow-x-auto p-2 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto",
    "max-h-[28%] sm:max-h-none sm:w-[140px] md:w-[180px]",
  );
}

export function filmstripTileClass({ screenShare = false } = {}) {
  if (screenShare) {
    return "relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-lg bg-slate-950 sm:h-24 sm:w-40";
  }

  return "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-950 sm:h-auto sm:w-full sm:aspect-video";
}
