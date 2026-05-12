/**
 * CollapsibleFormCard
 *
 * A SectionCard whose header has a Plus / Cancel toggle and whose body is only
 * rendered when open. Captures a pattern that repeats 4x across the Phase-2
 * pages (Deliverables, Events, Communication).
 *
 * Props:
 *  - title: string
 *  - description?: string
 *  - triggerLabel?: string         (default "New")
 *  - cancelLabel?: string          (default "Cancel")
 *  - triggerIcon?: React.ComponentType  (default Plus)
 *  - cancelIcon?: React.ComponentType   (default X)
 *  - isOpen: boolean               (controlled)
 *  - onToggle: (next: boolean) => void
 *  - disabled?: boolean            (hides the trigger; useful for non-admin)
 *  - headerExtras?: React.ReactNode (rendered to the left of the trigger)
 *  - children?: React.ReactNode    (form body; only rendered when isOpen)
 *  - className?: string
 */
import React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "../../ui/button";
import SectionCard from "./SectionCard";

export default function CollapsibleFormCard({
  title,
  description,
  triggerLabel = "New",
  cancelLabel = "Cancel",
  triggerIcon: TriggerIcon = Plus,
  cancelIcon: CancelIcon = X,
  isOpen,
  onToggle,
  disabled = false,
  headerExtras,
  children,
  className,
}) {
  const handleClick = () => {
    if (typeof onToggle === "function") onToggle(!isOpen);
  };

  return (
    <SectionCard className={className}>
      <SectionCard.Header
        title={title}
        description={description}
        action={
          <div className="flex items-center gap-2">
            {headerExtras}
            {!disabled && (
              <Button
                size="sm"
                onClick={handleClick}
                className={
                  isOpen
                    ? "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary"
                    : "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                }
              >
                {isOpen ? (
                  <>
                    <CancelIcon className="mr-2 h-4 w-4" />
                    {cancelLabel}
                  </>
                ) : (
                  <>
                    <TriggerIcon className="mr-2 h-4 w-4" />
                    {triggerLabel}
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />
      {isOpen && <SectionCard.Body>{children}</SectionCard.Body>}
    </SectionCard>
  );
}
