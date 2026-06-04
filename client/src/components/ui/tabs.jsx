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
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./utils";
function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      {..._extends(
        {
          "data-slot": "tabs",
          className: cn("flex flex-col gap-2", className),
        },
        props,
      )}
    />
  );
}
function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      {..._extends(
        {
          "data-slot": "tabs-list",
          className: cn(
            "text-muted-foreground inline-flex h-9 w-fit items-center justify-center flex border-b border-border",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      {..._extends(
        {
          "data-slot": "tabs-trigger",
          className: cn(
            "data-[state=active]:text-foreground data-[state=active]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-full flex-1 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      {..._extends(
        {
          "data-slot": "tabs-content",
          className: cn("flex-1 outline-none", className),
        },
        props,
      )}
    />
  );
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
