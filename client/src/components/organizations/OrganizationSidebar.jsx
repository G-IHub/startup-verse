/**
 * Organization admin sidebar — same surface / shadow language as app shell.
 */
import React from "react";
import { cn } from "../ui/utils";
import {
  Home,
  Activity,
  BarChart3,
  Target,
  FileText,
  Calendar,
  Bell,
  UserPlus,
  BookOpen,
  Users,
  Settings,
  X,
  Sparkles,
} from "lucide-react";

function formatCount(count) {
  if (count > 99) return "99+";
  return String(count);
}

function NavCountBadge({ count }) {
  if (count === undefined || count === null || count <= 0) return null;
  return (
    <span className="ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-pill bg-primary px-1.5 font-body text-[10px] font-semibold leading-none text-white shadow-[0_2px_8px_rgba(58,90,254,0.35)]">
      {formatCount(count)}
    </span>
  );
}

export default function OrganizationSidebar({
  currentPage,
  onPageChange,
  organizationName,
  cohortName,
  stats,
  isOpen,
  onClose,
}) {
  const handleNavClick = (page) => {
    onPageChange(page);
    if (onClose && window.innerWidth < 768) onClose();
  };

  const primaryNavItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "portfolio", label: "Portfolio", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const programNavItems = [
    { id: "milestones", label: "Milestones", icon: Target },
    { id: "deliverables", label: "Deliverables", icon: FileText },
    { id: "events", label: "Agenda", icon: Calendar },
    { id: "communication", label: "Communication", icon: Bell },
    { id: "mentors", label: "Mentors", icon: UserPlus },
    { id: "resources", label: "Library", icon: BookOpen },
    {
      id: "members",
      label: "Members",
      icon: Users,
      badge: stats?.totalStartups,
    },
  ];

  const utilityNavItems = [{ id: "settings", label: "Settings", icon: Settings }];

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = currentPage === item.id;

    return (
      <li>
        <button
          type="button"
          onClick={() => handleNavClick(item.id)}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex w-full items-center gap-2.5 rounded-input px-2.5 py-2 text-left font-body transition-all duration-200 ease-in-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            active
              ? "sidebar-selected"
              : "text-text-body hover:bg-surface-page hover:text-text-heading",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-input transition-colors duration-200",
              active
                ? "bg-primary/10 text-primary"
                : "text-text-muted group-hover:text-primary",
            )}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight">
            {item.label}
          </span>
          {item.badge != null ? <NavCountBadge count={item.badge} /> : null}
        </button>
      </li>
    );
  };

  const NavList = ({ items }) => (
    <ul className="space-y-0.5" role="list">
      {items.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}
    </ul>
  );

  return (
    <>
      {isOpen && onClose ? (
        <div
          className="fixed inset-0 z-40 bg-[var(--modal-overlay)]/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[216px] shrink-0 flex-col border-r border-surface-border bg-surface-card font-body",
          "transition-transform duration-300 ease-out md:static",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Organization navigation"
      >
        <div className="flex min-h-[82px] shrink-0 items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)]">
            <Sparkles className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-bold text-text-heading">
              {organizationName || "Organization"}
            </p>
            <p className="truncate font-body text-[11px] text-text-muted">
              {cohortName || "Admin"}
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-input text-text-muted transition-colors hover:bg-white/80 md:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mx-4 mb-2 h-px bg-surface-border/80" aria-hidden />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-4">
          <nav className="flex flex-1 flex-col gap-0">
            <NavList items={primaryNavItems} />
            <div className="my-3 h-px bg-surface-border/60" aria-hidden />
            <NavList items={programNavItems} />
            <div className="my-3 mt-auto h-px bg-surface-border/60" aria-hidden />
            <NavList items={utilityNavItems} />
          </nav>
        </div>
      </aside>
    </>
  );
}
