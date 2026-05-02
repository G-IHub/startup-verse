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
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "./utils";
function Drawer({ ...props }) {
  return (
    <DrawerPrimitive.Root
      {..._extends(
        {
          "data-slot": "drawer",
        },
        props,
      )}
    />
  );
}
function DrawerTrigger({ ...props }) {
  return (
    <DrawerPrimitive.Trigger
      {..._extends(
        {
          "data-slot": "drawer-trigger",
        },
        props,
      )}
    />
  );
}
function DrawerPortal({ ...props }) {
  return (
    <DrawerPrimitive.Portal
      {..._extends(
        {
          "data-slot": "drawer-portal",
        },
        props,
      )}
    />
  );
}
function DrawerClose({ ...props }) {
  return (
    <DrawerPrimitive.Close
      {..._extends(
        {
          "data-slot": "drawer-close",
        },
        props,
      )}
    />
  );
}
function DrawerOverlay({ className, ...props }) {
  return (
    <DrawerPrimitive.Overlay
      {..._extends(
        {
          "data-slot": "drawer-overlay",
          className: cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function DrawerContent({ className, children, ...props }) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        {..._extends(
          {
            "data-slot": "drawer-content",
            className: cn(
              "group/drawer-content fixed z-50 flex h-auto flex-col bg-[var(--card)] text-[var(--card-foreground)]",
              "data-[vaul-drawer-direction=top]:inset-x-4 data-[vaul-drawer-direction=top]:top-4 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:max-w-[calc(100%-2rem)] data-[vaul-drawer-direction=top]:mx-auto data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b sm:data-[vaul-drawer-direction=top]:inset-x-auto sm:data-[vaul-drawer-direction=top]:max-w-lg",
              "data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:max-w-[calc(100%-2rem)] data-[vaul-drawer-direction=bottom]:mx-auto data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t sm:data-[vaul-drawer-direction=bottom]:inset-x-auto sm:data-[vaul-drawer-direction=bottom]:max-w-lg",
              "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
              "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
              className,
            ),
          },
          props,
        )}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}
function DrawerHeader({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "drawer-header",
          className: cn("flex flex-col gap-1.5 p-4", className),
        },
        props,
      )}
    />
  );
}
function DrawerFooter({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "drawer-footer",
          className: cn("mt-auto flex flex-col gap-2 p-4", className),
        },
        props,
      )}
    />
  );
}
function DrawerTitle({ className, ...props }) {
  return (
    <DrawerPrimitive.Title
      {..._extends(
        {
          "data-slot": "drawer-title",
          className: cn("text-foreground font-semibold", className),
        },
        props,
      )}
    />
  );
}
function DrawerDescription({ className, ...props }) {
  return (
    <DrawerPrimitive.Description
      {..._extends(
        {
          "data-slot": "drawer-description",
          className: cn("text-muted-foreground text-sm", className),
        },
        props,
      )}
    />
  );
}
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
