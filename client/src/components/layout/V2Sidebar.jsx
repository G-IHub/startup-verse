/**
 * V2Sidebar — 72px icon-only sidebar for the V2 Autonomous OS design.
 * Sits alongside the existing VerticalSidebar which powers V1 screens.
 *
 * Usage:
 *   <V2Sidebar currentPage={page} onPageChange={setPage} user={user} />
 */

import React from "react";
import { cn } from "../ui/utils";
import {
  Home,
  Zap,
  Building2,
  Users,
  Map,
  UserCheck,
  Bot,
  BookOpen,
  GraduationCap,
  Briefcase,
} from "lucide-react";

/* ── Nav item definitions ─────────────────────────────────────────────── */
const PRIMARY_NAV = [
  { id: "dashboard",        icon: Home,          label: "Dashboard",        page: "dashboard" },
  { id: "execution-engine", icon: Zap,           label: "Execution Engine", page: "execution-engine" },
  { id: "startup-office",   icon: Building2,     label: "Virtual Office",   page: "startup-office" },
  { id: "community",        icon: Users,         label: "Community",        page: "community" },
];

const SECONDARY_NAV = [
  { id: "journey",          icon: Map,           label: "Journey Stages",   page: "journey" },
  { id: "team",             icon: UserCheck,     label: "Team",             page: "team" },
  { id: "talent",           icon: Briefcase,     label: "Talent Marketplace", page: "talent" },
  { id: "ai-staff",         icon: Bot,           label: "AI Staff",         page: "ai-staff" },
  { id: "blueprints",       icon: BookOpen,      label: "Blueprint Library",page: "blueprints" },
  { id: "mentors",          icon: GraduationCap, label: "Mentors",          page: "mentors" },
];

/* ── Sub-component: a single sidebar icon button ─────────────────────── */
function SidebarBtn({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onClick(item)}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-[10px]",
        "transition-colors duration-150 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-v2-blue/40",
        isActive
          ? "bg-v2-purple-tint text-v2-purple"
          : "text-v2-subtle hover:bg-v2-page hover:text-v2-heading",
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />

      {/* Tooltip on hover */}
      <span
        className={cn(
          "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2",
          "whitespace-nowrap rounded-[8px] bg-v2-heading px-2.5 py-1.5",
          "font-body text-[11px] font-medium text-white shadow-lg",
          "opacity-0 transition-opacity group-hover:opacity-100",
        )}
        role="tooltip"
      >
        {item.label}
      </span>
    </button>
  );
}

/* ── Avatar button at bottom ─────────────────────────────────────────── */
function AvatarBtn({ user, onClick }) {
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <button
      type="button"
      title="My Profile"
      aria-label="My Profile"
      onClick={() => onClick({ page: "profile" })}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full",
        "bg-v2-blue-tint font-body text-[12px] font-semibold text-v2-blue-dark",
        "transition-opacity hover:opacity-80 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-v2-blue/40",
      )}
    >
      {initials || "?"}
    </button>
  );
}

/* ── Logo mark ───────────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-v2-blue">
      {/* "SV" monogram */}
      <span className="font-heading text-[13px] font-bold leading-none text-white">
        SV
      </span>
    </div>
  );
}

/* ── Separator ───────────────────────────────────────────────────────── */
function Sep() {
  return <div className="h-px w-7 rounded-full bg-v2-border" aria-hidden />;
}

/* ── Main export ─────────────────────────────────────────────────────── */
export default function V2Sidebar({ currentPage, onPageChange, user }) {
  const isActive = (item) => currentPage === item.page || currentPage === item.id;

  const handleClick = (item) => {
    if (item.page && onPageChange) onPageChange(item.page);
  };

  return (
    <aside
      className={cn(
        "flex h-screen w-[72px] shrink-0 flex-col items-center",
        "border-r border-v2-border bg-v2-surface py-4 gap-1",
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="mb-4">
        <LogoMark />
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col items-center gap-1" aria-label="Primary">
        {PRIMARY_NAV.map((item) => (
          <div key={item.id} className="group">
            <SidebarBtn
              item={item}
              isActive={isActive(item)}
              onClick={handleClick}
            />
          </div>
        ))}
      </nav>

      {/* Separator */}
      <div className="my-2">
        <Sep />
      </div>

      {/* Secondary nav */}
      <nav className="flex flex-col items-center gap-1" aria-label="Secondary">
        {SECONDARY_NAV.map((item) => (
          <div key={item.id} className="group">
            <SidebarBtn
              item={item}
              isActive={isActive(item)}
              onClick={handleClick}
            />
          </div>
        ))}
      </nav>

      {/* Spacer pushes avatar to bottom */}
      <div className="flex-1" />

      {/* Avatar */}
      <AvatarBtn user={user} onClick={handleClick} />
    </aside>
  );
}
