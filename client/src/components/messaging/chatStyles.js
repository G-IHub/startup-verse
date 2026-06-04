import { cn } from "../ui/utils";

/** Layout shells — thread content fills available width with light edge padding only */
export const chatShell = {
  sidebar: cn(
    "flex min-w-0 shrink-0 flex-col border-r border-surface-border bg-white",
    "w-full max-md:flex-1 md:w-64 lg:w-[280px]",
  ),
  thread: "flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-page max-md:min-h-0",
  threadHeader: cn(
    "sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-surface-border bg-white shadow-soft sm:h-14 sm:gap-3",
    "px-2 sm:px-3 lg:px-4",
  ),
  threadScroll: "min-h-0 flex-1 overflow-hidden bg-surface-page",
  threadColumn: "w-full min-w-0 px-2 py-3 sm:px-3 sm:py-4 lg:px-4",
  composerFooter: cn(
    "shrink-0 border-t border-surface-border bg-white",
    "px-2 py-2 sm:px-3 sm:py-3 lg:px-4",
  ),
  composerColumn: "w-full min-w-0",
};

/** Hide conversation list on small screens when a thread is open (and vice versa) */
export function chatSidebarPaneClass(hasOpenThread) {
  return cn(chatShell.sidebar, hasOpenThread && "max-md:hidden");
}

export function chatThreadPaneClass(hasOpenThread) {
  return cn(chatShell.thread, !hasOpenThread && "max-md:hidden");
}

export function messageRowWidthClass() {
  return "max-w-[min(92%,100%)] sm:max-w-[min(88%,36rem)] lg:max-w-[min(82%,44rem)]";
}

export function sidebarRowClass(isSelected) {
  return cn(
    "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-2.5 py-2.5 transition-colors duration-200",
    isSelected
      ? "border-primary/15 bg-primary-tint"
      : "border-transparent hover:bg-primary-tint/60",
  );
}

export function bubbleClass({ isMe, hasMedia = false }) {
  return cn(
    "max-w-full overflow-hidden font-body text-sm leading-relaxed",
    hasMedia ? "p-1.5" : "px-3.5 py-2.5",
    isMe
      ? "rounded-2xl rounded-br-md bg-primary text-white shadow-[0_2px_8px_rgba(58,90,254,0.15)] [&_p]:text-white"
      : "rounded-2xl rounded-bl-md border border-surface-border bg-white text-text-heading shadow-soft [&_p]:text-text-heading",
  );
}

export function bubbleCaptionClass(isMe) {
  return cn(
    "px-1.5 pb-0.5 pt-1.5 text-sm leading-relaxed",
    isMe ? "text-white/95" : "text-text-heading",
  );
}

export function timestampClass(isMe) {
  return cn(
    "mt-1 px-1 font-body text-[10px] text-text-muted",
    isMe ? "text-right" : "text-left",
  );
}

export function senderNameClass() {
  return "mb-1 px-0.5 font-body text-xs font-medium text-text-muted";
}

export function avatarFallbackClass() {
  return "rounded-card bg-primary font-heading text-[10px] font-bold text-white";
}

export function composerDockClass() {
  return "rounded-2xl border border-surface-border bg-white p-1.5 shadow-soft sm:p-2";
}

export function composerInputClass() {
  return cn(
    "min-h-9 flex-1 resize-none border-0 bg-transparent font-body text-sm text-text-heading sm:min-h-10",
    "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-0",
  );
}

export function composerSendButtonClass(disabled) {
  return cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white sm:h-10 sm:w-10",
    "shadow-[0_4px_12px_rgba(58,90,254,0.25)] transition-colors hover:bg-primary-hover",
    disabled && "cursor-not-allowed opacity-50",
  );
}

export function composerIconButtonClass() {
  return cn(
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted sm:h-9 sm:w-9",
    "transition-colors hover:bg-primary-tint hover:text-primary",
  );
}

export function dateDividerClass() {
  return "relative my-4 flex items-center justify-center sm:my-5";
}

export function dateDividerLineClass() {
  return "absolute inset-x-0 top-1/2 h-px bg-surface-border";
}

export function dateDividerPillClass() {
  return "relative rounded-pill bg-white px-3 py-1 font-body text-xs font-medium text-text-muted shadow-soft";
}

export function replyQuoteClass(isMe) {
  return cn(
    "mb-1.5 max-w-full rounded-lg border-l-2 px-2 py-1.5 font-body text-xs",
    isMe
      ? "border-white/50 bg-white/10 text-white/90 [&_p]:text-white/90"
      : "border-primary/40 bg-primary-tint/50 text-text-muted [&_p]:text-text-muted",
  );
}

export function forwardBlockClass() {
  return "mb-1 flex w-full flex-col items-start gap-1.5 text-left";
}

/** WhatsApp-style meta line — not part of the message body (use span, not p, inside bubbles) */
export function forwardLabelClass(isMe) {
  return cn(
    "block w-full text-left font-body text-[10px] font-normal italic leading-tight",
    isMe ? "text-white/45" : "text-text-muted/70",
  );
}

export function forwardBodyClass(isMe) {
  return cn(
    "w-full font-body text-sm font-normal not-italic leading-relaxed",
    isMe ? "text-white" : "text-text-heading",
  );
}

export function tombstoneBubbleClass(isMe) {
  return cn(
    "max-w-full px-3.5 py-2.5 font-body text-sm italic",
    isMe
      ? "rounded-2xl rounded-br-md bg-primary/60 text-white/80"
      : "rounded-2xl rounded-bl-md border border-surface-border bg-surface-page text-text-muted shadow-soft",
  );
}

export function composerReplyStripClass() {
  return "mb-2 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary-tint/60 px-2.5 py-2";
}

export function selectionBubbleClass(isSelected) {
  return cn(
    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-transparent",
  );
}

export function selectionCheckClass(isMe, isSelected) {
  return cn(
    "absolute top-1/2 z-[2] flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border-2",
    isMe ? "-left-7" : "-right-7",
    isSelected
      ? "border-primary bg-primary text-white"
      : "border-surface-border bg-white",
  );
}

export function swipeReplyTrackClass(isMe) {
  return cn(
    "pointer-events-none absolute inset-y-0 flex w-12 items-center",
    isMe ? "right-full" : "left-0",
  );
}

export function swipeReplyIconClass(active) {
  return cn(
    "flex h-8 w-8 items-center justify-center rounded-full bg-primary-tint text-primary transition-opacity",
    active && "bg-primary text-white",
  );
}
