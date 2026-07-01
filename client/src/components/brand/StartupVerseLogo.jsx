import React from "react";
import { cn } from "../ui/utils";
import { STARTUP_VERSE_LOGO_SRC } from "../../config/brand";

export default function StartupVerseLogo({
  className,
  alt = "StartupVerse",
  ...props
}) {
  return (
    <img
      src={STARTUP_VERSE_LOGO_SRC}
      alt={alt}
      className={cn("h-8 w-auto object-contain", className)}
      {...props}
    />
  );
}
