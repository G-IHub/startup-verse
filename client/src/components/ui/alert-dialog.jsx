"use client";

function _extends() {
  return (
    (_extends = Object.assign
      ? Object.assign.bind()
      : function (n) {
          for (var e = 1; e < arguments.length; e++) {
            var t = arguments[e];
            for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
          }
          return n;
        }),
    _extends.apply(null, arguments)
  );
}
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "./utils";
import { buttonVariants } from "./button";
function AlertDialog({ ...props }) {
  return (
    <AlertDialogPrimitive.Root
      {..._extends(
        {
          "data-slot": "alert-dialog",
        },
        props,
      )}
    />
  );
}
function AlertDialogTrigger({ ...props }) {
  return (
    <AlertDialogPrimitive.Trigger
      {..._extends(
        {
          "data-slot": "alert-dialog-trigger",
        },
        props,
      )}
    />
  );
}
function AlertDialogPortal({ ...props }) {
  return (
    <AlertDialogPrimitive.Portal
      {..._extends(
        {
          "data-slot": "alert-dialog-portal",
        },
        props,
      )}
    />
  );
}
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <AlertDialogPrimitive.Overlay
      {..._extends(
        {
          ref: ref,
          "data-slot": "alert-dialog-overlay",
          className: cn(
            "sv-modal-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50",
            className,
          ),
        },
        props,
      )}
    />
  );
});
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(
  ({ className, overlayClassName, ...props }, ref) => (
    <AlertDialogPortal>
      <AlertDialogOverlay className={overlayClassName} />
      <AlertDialogPrimitive.Content
        {..._extends(
          {
            ref,
            "data-slot": "alert-dialog-content",
            className: cn(
              "bg-surface-card font-body text-text-body data-[state=open]:animate-sv-modal-centered-in data-[state=closed]:animate-sv-modal-centered-out fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-3rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[16px] border-0 p-6 shadow-modal duration-200 ease-in-out sm:max-w-lg",
              className,
            ),
          },
          props,
        )}
      />
    </AlertDialogPortal>
  ),
);
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "alert-dialog-header",
          className: cn(
            "flex flex-col gap-2 border-b border-[#e2e4f0] pb-4 text-center sm:text-left",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "alert-dialog-footer",
          className: cn(
            "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title
      {..._extends(
        {
          "data-slot": "alert-dialog-title",
          className: cn(
            "font-heading text-lg font-bold text-[#0d0d0d]",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      {..._extends(
        {
          "data-slot": "alert-dialog-description",
          className: cn(
            "font-body text-sm font-normal text-[#4a4a5a]",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function AlertDialogAction({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Action
      {..._extends(
        {
          "data-slot": "button",
          className: cn(buttonVariants(), className),
        },
        props,
      )}
    />
  );
}
function AlertDialogCancel({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Cancel
      {..._extends(
        {
          "data-slot": "button",
          className: cn(
            buttonVariants({
              variant: "outline",
            }),
            className,
          ),
        },
        props,
      )}
    />
  );
}
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
