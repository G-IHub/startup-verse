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
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "./utils";
function Progress({ className, value, ...props }) {
  // 🔧 FIX: Ensure value is always a valid number (handle NaN, undefined, null)
  const safeValue =
    typeof value === "number" && !isNaN(value)
      ? Math.min(Math.max(value, 0), 100)
      : 0;
  return (
    <ProgressPrimitive.Root
      {..._extends(
        {
          "data-slot": "progress",
          className: cn(
            "bg-muted relative h-2 w-full overflow-hidden rounded-full border border-muted-foreground/20",
            className,
          ),
          value: safeValue,
        },
        props,
      )}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - safeValue}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}
export { Progress };
