import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  return (
    <Sonner
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast-modern rounded-input border border-surface-border bg-surface-card px-3 py-2 shadow-[var(--shadow-soft)]",
          title: "font-body text-[13px] font-semibold text-text-heading",
          description: "font-body text-[12px] text-text-muted",
          actionButton:
            "h-7 rounded-input bg-primary px-2.5 font-body text-[12px] font-semibold text-white",
          cancelButton:
            "h-7 rounded-input border border-surface-border bg-surface-card px-2.5 font-body text-[12px] font-medium text-text-body",
          closeButton:
            "h-6 w-6 rounded-md border border-surface-border bg-surface-card text-text-muted transition-colors hover:bg-surface-page hover:text-text-heading",
        },
      }}
      {...props}
    />
  );
}
