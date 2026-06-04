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
function Textarea({ className, ...props }) {
  return (
    <textarea
      {..._extends(
        {
          "data-slot": "textarea",
          className: cn(
            "resize-none border border-border placeholder:text-muted-foreground placeholder:text-xs focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-lg bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] hover:border-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          ),
        },
        props,
      )}
    />
  );
}
export { Textarea };
