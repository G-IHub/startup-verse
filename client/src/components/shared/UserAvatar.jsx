import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../ui/utils";
import { resolveMediaUrl, resolveUserAvatar } from "../../utils/resolveMediaUrl";

function initialsFromName(name) {
  const parts = String(name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

/**
 * Consistent person avatar: prefers avatarUrl, then legacy avatar fields.
 * Pass either `user` (object) or an explicit `src` string.
 */
export default function UserAvatar({
  user,
  src,
  name,
  className,
  fallbackClassName,
  imageClassName,
  alt = "",
}) {
  const resolved =
    (src ? resolveMediaUrl(src) : "") || resolveUserAvatar(user || {});
  const label = name || user?.name || user?.userName || "?";

  return (
    <Avatar className={cn("shrink-0", className)}>
      {resolved ? (
        <AvatarImage
          src={resolved}
          alt={alt}
          className={cn("object-cover", imageClassName)}
        />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {initialsFromName(label)}
      </AvatarFallback>
    </Avatar>
  );
}
