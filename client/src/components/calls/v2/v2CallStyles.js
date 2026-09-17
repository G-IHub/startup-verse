import { cn } from "../../ui/utils";

/**
 * V2 restyle of callStyles.js. Same shape/keys, V2 (v2-blue/v2-purple) tokens
 * instead of V1's surface/primary/accent tokens. Consumed only by the
 * V2Call components in this folder — V1's calls JSX files keep importing
 * ../callStyles unchanged.
 */
export const v2CallShell = {
  root: "relative flex h-full min-h-0 w-full flex-col",
  header:
    "flex shrink-0 items-start justify-between gap-3 border-b border-v2-border bg-v2-surface px-4 py-3 sm:px-5 sm:py-4",
  headerTitle: "font-heading text-lg font-semibold leading-tight text-v2-heading sm:text-xl",
  headerSubtitle: "mt-1.5 max-w-3xl font-body text-sm leading-relaxed text-v2-muted sm:text-[15px]",
  headerActions: "flex shrink-0 items-center gap-2",
  popoutBtn: cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-v2-border bg-v2-page text-v2-muted",
    "transition-colors hover:border-v2-blue/40 hover:bg-v2-blue-tint hover:text-v2-blue-dark",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-blue/35",
  ),
  participantPill:
    "inline-flex shrink-0 items-center rounded-full border border-v2-border bg-v2-page px-2.5 py-1.5 font-body text-xs font-medium text-v2-heading",
  bodyRow: "flex min-h-0 flex-1 flex-row",
  videoColumn: "flex min-h-0 min-w-0 flex-1 flex-col",
  videoMain: "flex min-h-0 flex-1 flex-col px-2 pt-1 pb-2",
  stageCard:
    "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-v2-border bg-slate-950",
  controlsRow: "flex w-full shrink-0",
  stage: "relative flex min-h-0 flex-1 flex-col bg-slate-950",
  stageOverlay:
    "absolute inset-0 z-10 flex items-center justify-center bg-v2-page/80 font-body text-sm text-v2-heading backdrop-blur-sm",
  controlBar:
    "mx-auto inline-flex items-center gap-1.5 rounded-full border border-v2-border/80 bg-v2-surface/95 px-2.5 py-1.5 shadow-sm backdrop-blur-md",
  controlIconBtn: cn(
    "inline-flex h-7 w-7 items-center justify-center !rounded-full !border !border-gray-300 !bg-white text-v2-heading",
    "transition-all duration-200 hover:!bg-v2-blue-tint hover:text-v2-blue-dark hover:!border-blue-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-blue/35",
    "active:scale-95",
  ),
  controlIconBtnActive:
    "!border-blue-300 !bg-v2-blue-tint text-v2-blue-dark hover:!bg-v2-blue-tint hover:text-v2-blue-dark",
  controlIconBtnMuted: "!border-red-200 !bg-red-50 text-red-600 hover:!bg-red-100 hover:text-red-600",
  controlIconBtnShareActive:
    "!border-purple-300 !bg-v2-purple-tint text-v2-purple-dark hover:!bg-v2-purple-tint hover:text-v2-purple-dark",
  endCallBtn: cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm",
    "transition-all duration-200 hover:bg-red-700 active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300",
  ),
  sidePanel: "flex min-h-0 flex-1 flex-col",
  sidePanelHeader: "shrink-0 border-b border-v2-border/60 px-3 pt-3",
  sidePanelBody: "min-h-0 flex-1 overflow-hidden bg-v2-page/60",
  chatBanner: "border-b border-v2-blue/15 bg-v2-blue-tint px-3 py-2 font-body text-xs text-v2-blue-dark",
  chatList: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-v2-page/60 px-2 py-2",
  chatInputFooter: "shrink-0 border-t border-v2-border/60 bg-v2-surface p-2",
  chatInputRow: "flex items-end gap-2",
  chatTextInput: cn(
    "min-h-[40px] flex-1 resize-none rounded-xl border border-v2-border bg-v2-page px-3 py-2",
    "font-body text-sm text-v2-heading placeholder:text-v2-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-blue/35",
  ),
  chatSendBtn: cn(
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-v2-blue text-white",
    "transition-colors duration-200 hover:bg-v2-blue-dark disabled:cursor-not-allowed disabled:opacity-50",
  ),
};

export function chatBubbleClass(isLocal) {
  return cn(
    "max-w-[85%] px-3.5 py-2.5 font-body text-sm leading-relaxed",
    isLocal
      ? "ml-auto rounded-2xl rounded-br-md bg-v2-blue text-white"
      : "rounded-2xl rounded-bl-md border border-v2-border bg-v2-surface text-v2-heading",
  );
}

export function chatMetaClass(isLocal) {
  return cn(
    "mb-1 flex items-center gap-2 px-1 font-body text-[11px]",
    isLocal ? "justify-end text-v2-muted" : "text-v2-muted",
  );
}

export function participantCardClass() {
  return cn(
    "flex items-center gap-2 rounded-2xl border border-v2-border bg-v2-page p-2",
    "transition-all duration-200 hover:border-v2-blue/25 hover:shadow-sm",
  );
}

export function participantListClass() {
  return "flex flex-col gap-2 p-2";
}

export function statusDotClass(variant = "offline") {
  const colors = {
    "in-call": "bg-v2-blue",
    online: "bg-v2-green",
    offline: "bg-gray-300",
  };
  return cn("h-2 w-2 shrink-0 rounded-full", colors[variant] || colors.offline);
}

export function tileClass({ isSpeaking = false, compact = false, isMain = false, fillStage = false } = {}) {
  return cn(
    "relative overflow-hidden bg-slate-950",
    compact ? "rounded-xl" : "rounded-2xl",
    isMain || fillStage ? "h-full w-full" : "aspect-video w-full",
    isSpeaking && "ring-2 ring-v2-blue ring-offset-2 ring-offset-slate-950",
  );
}

export function tileAvatarOffClass(compact = false) {
  return cn(
    "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-v2-blue/10 via-v2-purple/10 to-v2-blue-tint/40 p-4",
    compact && "p-2",
  );
}

export function avatarFallbackClass(compact = false) {
  return cn(
    "flex items-center justify-center rounded-full bg-gradient-to-br from-v2-blue to-v2-purple font-heading font-semibold text-white shadow-sm",
    compact ? "h-10 w-10 text-sm" : "h-20 w-20 text-xl sm:h-24 sm:w-24 sm:text-2xl",
  );
}

export function rosterAvatarClass() {
  return cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
    "bg-gradient-to-br from-v2-blue to-v2-purple font-heading text-sm font-semibold text-white",
  );
}

export function participantBadgeClass() {
  return cn(
    "absolute bottom-2 left-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5",
    "rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md",
  );
}

export function tileNameLabelClass() {
  return cn(
    "absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/40 px-2 py-0.5",
    "font-body text-[10px] font-medium text-white backdrop-blur-md",
  );
}

export function gridContainerClass() {
  return "grid h-full w-full gap-1.5 p-1.5";
}

export function spotlightMainClass({ screenShare = false } = {}) {
  return cn("flex min-h-0 min-w-0 flex-1", screenShare ? "p-1 sm:p-2" : "p-2");
}

export function spotlightFilmstripClass({ screenShare = false } = {}) {
  if (screenShare) {
    return cn(
      "flex shrink-0 gap-2 overflow-x-auto border-t border-v2-border/70 bg-v2-surface/95 p-2",
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
