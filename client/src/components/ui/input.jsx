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
import { cn } from "./utils";

/** Shared surface styles for text inputs and password-input (thinner focus ring). */
export const inputSurfaceClassName =
  "file:text-foreground placeholder:text-muted-foreground placeholder:text-xs selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-lg px-3 py-2 text-base bg-input-background border border-border transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-2 hover:border-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive";

function Input({ className, type, ...props }) {
  return (
    <input
      {..._extends(
        {
          type: type,
          "data-slot": "input",
          className: cn(inputSurfaceClassName, className),
        },
        props,
      )}
    />
  );
}
export { Input };
