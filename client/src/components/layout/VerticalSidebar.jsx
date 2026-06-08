import React from "react";
import { cn } from "../ui/utils";
import {
  Building,
  Users,
  Home,
  Sparkles,
  Settings,
  Inbox,
  BarChart3,
  X,
  MessageCircle,
} from "lucide-react";

function formatCount(count) {
  if (count > 99) return "99+";
  return String(count);
}

/** High-contrast count pill — matches status/error tokens, not theme Badge */
function NavCountBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className="ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-pill bg-status-error px-1.5 font-body text-[10px] font-semibold leading-none text-white shadow-[0_1px_4px_rgba(255,79,107,0.45)]"
      aria-label={`${count} unread`}
    >
      {formatCount(count)}
    </span>
  );
}

export default function VerticalSidebar({
  user,
  currentPage,
  virtualOfficeView,
  onPageChange,
  onVirtualOfficeViewChange,
  unreadCount = 0,
  isOpen = false,
  onClose,
}) {
  const inboxBadgeCount = unreadCount > 0 ? unreadCount : 0;

  const allNavItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Home",
      page: "dashboard",
      roles: ["founder", "team-member", "team", "talent", "organization-admin"],
    },
    {
      id: "virtual-office",
      icon: Building,
      label: "Office",
      page: "startup-office",
      view: "workspace",
      roles: ["founder", "team-member", "team"],
    },
    {
      id: "browse",
      icon: Users,
      label: "Browse",
      page: user.role === "talent" ? "browse-startups" : "startup-office",
      view: user.role === "talent" ? undefined : "matching",
      roles: ["founder", "talent"],
    },
    ...(user.role === "talent"
      ? [{
          id: "talent-chat",
          icon: MessageCircle,
          label: "Chat",
          page: "talent-chat",
          roles: ["talent"],
        }]
      : []),
    ...(user.role === "founder" || user.role === "team-member" || user.role === "team"
      ? [{
          id: "founder-chat",
          icon: MessageCircle,
          label: "Chat",
          page: "founder-chat",
          roles: ["founder", "team-member", "team"],
        }]
      : []),
  ];

  const primaryNavItems = allNavItems.filter((item) => item.roles.includes(user.role));

  const allUtilityNavItems = [
    {
      id: "inbox",
      icon: Inbox,
      label: "Inbox",
      page: "inbox",
      badge: inboxBadgeCount > 0 ? inboxBadgeCount : null,
      roles: ["founder", "team-member", "team", "talent"],
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      page: "analytics",
      roles: ["founder"],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      page: "settings",
      roles: ["founder", "team-member", "team", "talent", "organization-admin"],
    },
  ];

  const utilityNavItems = allUtilityNavItems.filter((item) =>
    item.roles.includes(user.role),
  );

  const isActive = (item) => {
    if (user.role === "talent" && item.id === "browse") {
      return currentPage === "browse-startups";
    }
    if (user.role === "talent" && item.id === "dashboard") {
      return currentPage === "dashboard";
    }
    if (item.page && item.view) {
      return currentPage === item.page && virtualOfficeView === item.view;
    }
    return currentPage === item.page;
  };

  const handleNavClick = (item) => {
    if (item.page) {
      const opts =
        item.view != null
          ? { ...item.options, officeView: item.view }
          : item.options;
      onPageChange(item.page, opts);
    } else if (item.view && onVirtualOfficeViewChange) {
      onVirtualOfficeViewChange(item.view);
    }
    if (onClose) onClose();
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <li>
        <button
          type="button"
          data-tour={item.id}
          onClick={() => handleNavClick(item)}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex w-full items-center gap-2.5 rounded-input px-2.5 py-2 text-left font-body transition-all duration-200 ease-in-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            active
              ? "sidebar-selected shadow-[inset_3px_0_0_0_var(--primary)]"
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
          {item.badge ? <NavCountBadge count={item.badge} /> : null}
        </button>
      </li>
    );
  };

  return (
    <>
      {isOpen && onClose ? (
        <div
          className="fixed inset-0 z-40 bg-(--modal-overlay)/40 md:hidden"
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
        aria-label="Main navigation"
      >
        <div className="flex shrink-0 items-center gap-2.5 px-4 pb-2 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)]">
            <Sparkles className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-bold text-text-heading">
              StartupVerse
            </p>
            <p className="truncate font-body text-[11px] text-text-muted capitalize">
              {user.role?.replace(/-/g, " ") || "Member"}
            </p>
          </div>
          {isOpen && onClose ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-input text-text-muted transition-colors hover:bg-white/80 hover:text-text-heading md:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mx-4 mb-2 h-px bg-surface-border/80" aria-hidden />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-4">
          <nav aria-label="Application" className="flex flex-1 flex-col">
            <ul className="space-y-0.5" role="list">
              {primaryNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </ul>

            <div className="my-3 h-px bg-surface-border/60" aria-hidden />

            <ul className="mt-auto space-y-0.5" role="list">
              {utilityNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
