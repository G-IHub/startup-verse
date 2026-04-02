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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { cn } from "./utils";
import { buttonVariants } from "./button";
function Pagination({ className, ...props }) {
  return (
    <nav
      {..._extends(
        {
          role: "navigation",
          "aria-label": "pagination",
          "data-slot": "pagination",
          className: cn("mx-auto flex w-full justify-center", className),
        },
        props,
      )}
    />
  );
}
function PaginationContent({ className, ...props }) {
  return (
    <ul
      {..._extends(
        {
          "data-slot": "pagination-content",
          className: cn("flex flex-row items-center gap-1", className),
        },
        props,
      )}
    />
  );
}
function PaginationItem({ ...props }) {
  return (
    <li
      {..._extends(
        {
          "data-slot": "pagination-item",
        },
        props,
      )}
    />
  );
}
function PaginationLink({ className, isActive, size = "icon", ...props }) {
  return (
    <a
      {..._extends(
        {
          "aria-current": isActive ? "page" : undefined,
          "data-slot": "pagination-link",
          "data-active": isActive,
          className: cn(
            buttonVariants({
              variant: isActive ? "outline" : "ghost",
              size,
            }),
            className,
          ),
        },
        props,
      )}
    />
  );
}
function PaginationPrevious({ className, ...props }) {
  return (
    <PaginationLink
      {..._extends(
        {
          "aria-label": "Go to previous page",
          size: "default",
          className: cn("gap-1 px-2.5 sm:pl-2.5", className),
        },
        props,
      )}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}
function PaginationNext({ className, ...props }) {
  return (
    <PaginationLink
      {..._extends(
        {
          "aria-label": "Go to next page",
          size: "default",
          className: cn("gap-1 px-2.5 sm:pr-2.5", className),
        },
        props,
      )}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}
function PaginationEllipsis({ className, ...props }) {
  return (
    <span
      {..._extends(
        {
          "aria-hidden": true,
          "data-slot": "pagination-ellipsis",
          className: cn("flex size-9 items-center justify-center", className),
        },
        props,
      )}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
