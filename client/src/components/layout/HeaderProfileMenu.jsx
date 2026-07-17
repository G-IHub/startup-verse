import React from "react";
import {
  ChevronDown,
  LogOut,
  Rocket,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../ui/utils";
import { resolveUserAvatar } from "../../utils/resolveMediaUrl";

const menuItemClass =
  "mx-1 rounded-input font-body text-[13px] text-text-body cursor-pointer focus:bg-surface-page focus:text-text-heading";

const roleLabel = (role) => {
  if (role === "founder") return "Founder";
  if (role === "talent") return "Talent";
  if (role === "team-member") return "Team member";
  if (role === "organization-admin") return "Organization admin";
  return role?.replace(/-/g, " ") || "Member";
};

export default function HeaderProfileMenu({
  user,
  onLogout,
  showDevRoleSwitcher = false,
  onSwitchRole,
}) {
  const initials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : "??";
  const avatarSrc = resolveUserAvatar(user);

  return (
    <div data-tour="profile-menu">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 rounded-input border border-surface-border/60 bg-surface-card px-2 shadow-none transition-all duration-200 hover:border-surface-border hover:bg-surface-page"
          >
            <Avatar className="h-7 w-7 ring-2 ring-primary/15">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
              <AvatarFallback className="bg-primary font-body text-[11px] font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[min(100vw-2rem,17.5rem)] overflow-hidden rounded-card border border-surface-border bg-surface-card p-0 shadow-[var(--shadow-soft)]"
        >
          <div className="border-b border-surface-border/80 bg-surface-page/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                <AvatarFallback className="bg-primary font-body text-sm font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-bold text-text-heading">
                  {user.name}
                </p>
                <p className="truncate font-body text-xs text-text-muted">
                  {user.email}
                </p>
                <span className="mt-1.5 inline-flex rounded-pill bg-primary-tint px-2 py-0.5 font-body text-[10px] font-semibold text-primary capitalize">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            {!user.startupId ? (
              <>
                <div className="mx-1 mb-1 rounded-input border border-primary/15 bg-primary-tint/80 px-3 py-2.5">
                  <p className="font-body text-xs font-semibold text-primary">
                    Solo mode active
                  </p>
                  <p className="mt-0.5 font-body text-[11px] leading-snug text-text-body">
                    Find a co-founder to unlock team collaboration.
                  </p>
                </div>
              </>
            ) : null}

            {showDevRoleSwitcher ? (
              <>
                <DropdownMenuSeparator className="my-1.5 bg-surface-border/80" />
                <p className="px-3 pb-1 pt-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Dev tools
                </p>
                <DropdownMenuItem
                  onClick={() => onSwitchRole?.("founder")}
                  disabled={user.role === "founder"}
                  className={menuItemClass}
                >
                  <Rocket className="h-4 w-4 text-text-muted" />
                  Founder
                  {user.role === "founder" ? (
                    <span className="ml-auto text-[10px] text-primary">Active</span>
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSwitchRole?.("talent")}
                  disabled={user.role === "talent"}
                  className={menuItemClass}
                >
                  <Users className="h-4 w-4 text-text-muted" />
                  Talent
                  {user.role === "talent" ? (
                    <span className="ml-auto text-[10px] text-primary">Active</span>
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSwitchRole?.("team-member")}
                  disabled={user.role === "team-member"}
                  className={menuItemClass}
                >
                  <UserCheck className="h-4 w-4 text-text-muted" />
                  Team member
                  {user.role === "team-member" ? (
                    <span className="ml-auto text-[10px] text-primary">Active</span>
                  ) : null}
                </DropdownMenuItem>
              </>
            ) : null}

            <DropdownMenuSeparator className="my-1.5 bg-surface-border/80" />

            <DropdownMenuItem
              onClick={onLogout}
              className={cn(
                menuItemClass,
                "text-status-error focus:bg-status-error/8 focus:text-status-error",
              )}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Sign out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
