import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export default function CallLeaveDialog({
  open,
  onOpenChange,
  isInitiator,
  onConfirm,
}) {
  const title = isInitiator ? "End call for everyone?" : "Leave call?";
  const description = isInitiator
    ? "This ends the call for all participants."
    : "You will leave the call. Others can continue.";
  const confirmLabel = isInitiator ? "End call" : "Leave call";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName="z-[1001]"
        className="z-[1001]"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body text-sm text-text-body">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay in call</AlertDialogCancel>
          <AlertDialogAction
            className="bg-status-error text-white hover:bg-status-error/90"
            onClick={(event) => {
              event.preventDefault();
              onConfirm?.();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
