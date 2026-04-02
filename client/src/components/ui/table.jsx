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
import { cn } from "./utils";
function Table({ className, ...props }) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        {..._extends(
          {
            "data-slot": "table",
            className: cn("w-full caption-bottom text-sm", className),
          },
          props,
        )}
      />
    </div>
  );
}
function TableHeader({ className, ...props }) {
  return (
    <thead
      {..._extends(
        {
          "data-slot": "table-header",
          className: cn("[&_tr]:border-b", className),
        },
        props,
      )}
    />
  );
}
function TableBody({ className, ...props }) {
  return (
    <tbody
      {..._extends(
        {
          "data-slot": "table-body",
          className: cn("[&_tr:last-child]:border-0", className),
        },
        props,
      )}
    />
  );
}
function TableFooter({ className, ...props }) {
  return (
    <tfoot
      {..._extends(
        {
          "data-slot": "table-footer",
          className: cn(
            "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function TableRow({ className, ...props }) {
  return (
    <tr
      {..._extends(
        {
          "data-slot": "table-row",
          className: cn(
            "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function TableHead({ className, ...props }) {
  return (
    <th
      {..._extends(
        {
          "data-slot": "table-head",
          className: cn(
            "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function TableCell({ className, ...props }) {
  return (
    <td
      {..._extends(
        {
          "data-slot": "table-cell",
          className: cn(
            "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            className,
          ),
        },
        props,
      )}
    />
  );
}
function TableCaption({ className, ...props }) {
  return (
    <caption
      {..._extends(
        {
          "data-slot": "table-caption",
          className: cn("text-muted-foreground mt-4 text-sm", className),
        },
        props,
      )}
    />
  );
}
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
