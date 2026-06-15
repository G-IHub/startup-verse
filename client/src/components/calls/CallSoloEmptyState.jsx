import React from "react";
import { Users } from "lucide-react";

export default function CallSoloEmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center p-4">
      <div className="flex max-w-xs flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint shadow-soft">
          <Users className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <p className="font-heading text-base font-semibold text-text-heading">
          You&apos;re the first one here
        </p>
        <p className="font-body text-sm text-text-muted">
          Invite teammates from the panel, or wait for others to join
        </p>
      </div>
    </div>
  );
}
