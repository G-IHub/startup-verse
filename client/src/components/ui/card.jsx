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

/**
 * Card component - Material Design styled card container
 */
function Card({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "card",
          className: cn(
            "bg-card text-card-foreground flex flex-col gap-3 rounded-xl border transition-shadow",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function CardHeader({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "card-header",
          className: cn(
            "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 pt-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function CardTitle({ className, ...props }) {
  return (
    <h4
      {..._extends(
        {
          "data-slot": "card-title",
          className: cn("leading-none", className),
        },
        props,
      )}
    />
  );
}
function CardDescription({ className, ...props }) {
  return (
    <p
      {..._extends(
        {
          "data-slot": "card-description",
          className: cn("text-muted-foreground", className),
        },
        props,
      )}
    />
  );
}
function CardAction({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "card-action",
          className: cn(
            "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function CardContent({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "card-content",
          className: cn("px-4 py-6 sm:px-6", className),
        },
        props,
      )}
    />
  );
}
function CardFooter({ className, ...props }) {
  return (
    <div
      {..._extends(
        {
          "data-slot": "card-footer",
          className: cn(
            "flex items-center px-4 pb-4 [.border-t]:pt-4",
            className,
          ),
        },
        props,
      )}
    />
  );
}
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
