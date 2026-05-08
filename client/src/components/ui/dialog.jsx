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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "./utils";
function Dialog({ ...props }) {
  return (
    <DialogPrimitive.Root
      {..._extends(
        {
          "data-slot": "dialog",
        },
        props,
      )}
    />
  );
}
function DialogTrigger({ ...props }) {
  return (
    <DialogPrimitive.Trigger
      {..._extends(
        {
          "data-slot": "dialog-trigger",
        },
        props,
      )}
    />
  );
}
function DialogPortal({ ...props }) {
  return (
    <DialogPrimitive.Portal
      {..._extends(
        {
          "data-slot": "dialog-portal",
        },
        props,
      )}
    />
  );
}
function DialogClose({ ...props }) {
  return (
    <DialogPrimitive.Close
      {..._extends(
        {
          "data-slot": "dialog-close",
        },
        props,
      )}
    />
  );
}
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    {..._extends(
      {
        ref: ref,
        "data-slot": "dialog-overlay",
        className: cn(
          "sv-modal-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50",
          className,
        ),
      },
      props,
    )}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(
  (
    {
      className,
      children,
      overlayClassName,
      closeClassName,
      hideClose = false,
      ...props
    },
    ref,
  ) => (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        {..._extends(
          {
            ref: ref,
            "data-slot": "dialog-content",
            "aria-describedby": props["aria-describedby"] || undefined,
            className: cn(
              "bg-surface-card font-body text-text-body data-[state=open]:animate-sv-modal-centered-in data-[state=closed]:animate-sv-modal-centered-out fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-3rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[16px] border-0 p-6 shadow-modal duration-200 ease-in-out sm:max-w-lg",
              className,
            ),
          },
          props,
        )}
      >
        {children}
        {!hideClose ? (
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 rounded-lg bg-transparent p-1.5 text-[#a0a0b0] transition-all duration-200 ease-in-out hover:bg-[#f4f5ff] hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              closeClassName,
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;
function DialogHeader({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "dialog-header",
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
function DialogFooter({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "dialog-footer",
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
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    {..._extends(
      {
        ref: ref,
        "data-slot": "dialog-title",
        className: cn(
          "font-heading text-lg leading-none font-bold text-[#0d0d0d]",
          className,
        ),
      },
      props,
    )}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    {..._extends(
      {
        ref: ref,
        "data-slot": "dialog-description",
        className: cn(
          "font-body text-sm font-normal text-[#4a4a5a]",
          className,
        ),
      },
      props,
    )}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
