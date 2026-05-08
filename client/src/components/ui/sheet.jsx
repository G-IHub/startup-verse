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
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "./utils";
function Sheet({ ...props }) {
  return (
    <SheetPrimitive.Root
      {..._extends(
        {
          "data-slot": "sheet",
        },
        props,
      )}
    />
  );
}
function SheetTrigger({ ...props }) {
  return (
    <SheetPrimitive.Trigger
      {..._extends(
        {
          "data-slot": "sheet-trigger",
        },
        props,
      )}
    />
  );
}
function SheetClose({ ...props }) {
  return (
    <SheetPrimitive.Close
      {..._extends(
        {
          "data-slot": "sheet-close",
        },
        props,
      )}
    />
  );
}
function SheetPortal({ ...props }) {
  return (
    <SheetPrimitive.Portal
      {..._extends(
        {
          "data-slot": "sheet-portal",
        },
        props,
      )}
    />
  );
}
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <SheetPrimitive.Overlay
      {..._extends(
        {
          ref: ref,
          "data-slot": "sheet-overlay",
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
SheetOverlay.displayName = "SheetOverlay";
function SheetContent({ className, children, side = "right", ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        {..._extends(
          {
            "data-slot": "sheet-content",
            className: cn(
              "bg-surface-card font-body text-text-body data-[state=open]:animate-in data-[state=closed]:animate-out shadow-modal transition ease-in-out duration-200 fixed z-50 flex flex-col gap-4 border-0 data-[state=closed]:duration-300 data-[state=open]:duration-500",
              side === "right" &&
                "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 rounded-l-[16px] sm:max-w-sm",
              side === "left" &&
                "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 rounded-r-[16px] sm:max-w-sm",
              side === "top" &&
                "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-4 top-4 h-auto max-w-[calc(100%-2rem)] mx-auto rounded-b-[16px] sm:inset-x-auto sm:max-w-lg",
              side === "bottom" &&
                "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-4 bottom-4 h-auto max-w-[calc(100%-2rem)] mx-auto rounded-t-[16px] sm:inset-x-auto sm:max-w-lg",
              className,
            ),
          },
          props,
        )}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 rounded-lg bg-transparent p-1.5 text-[#a0a0b0] transition-all duration-200 ease-in-out hover:bg-[#f4f5ff] hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}
function SheetHeader({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "sheet-header",
          className: cn(
            "flex flex-col gap-1.5 border-b border-[#e2e4f0] p-4 pb-4",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function SheetFooter({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "sheet-footer",
          className: cn("mt-auto flex flex-col gap-2 p-4", className),
        },
        props,
      )}
    />
  );
}
function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      {..._extends(
        {
          "data-slot": "sheet-title",
          className: cn(
            "font-heading font-bold text-[#0d0d0d]",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      {..._extends(
        {
          "data-slot": "sheet-description",
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
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
