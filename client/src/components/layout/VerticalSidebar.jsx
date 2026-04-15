import React from "react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { cn } from "../ui/utils";
import {
  Building,
  Users,
  Home,
  Sparkles,
  Settings,
  Inbox,
  BarChart3,
  Award,
  X,
} from "lucide-react";

export default function VerticalSidebar({
  user,
  currentPage,
  virtualOfficeView,
  onPageChange,
  onVirtualOfficeViewChange,
  unreadCount = 0,
  notificationCount = 0,
  isOpen = false,
  onClose,
}) {
  const allNavItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Home",
      hint: "Overview",
      page: "dashboard",
      badge: null,
      roles: ["founder", "team-member", "team", "talent", "organization-admin"],
    },
    {
      id: "virtual-office",
      icon: Building,
      label: "Office",
      hint: "Workspace",
      page: "startup-office",
      view: "workspace",
      badge: null,
      roles: ["founder", "team-member", "team"],
    },
    {
      id: "team-matching",
      icon: Users,
      label: user.role === "talent" ? "Browse" : "Team",
      hint: user.role === "talent" ? "Opportunities" : "Matching",
      page: "startup-office",
      view: "matching",
      badge: null,
      roles: ["founder", "talent"],
    },
  ];

  const primaryNavItems = allNavItems.filter((item) => item.roles.includes(user.role));

  const allUtilityNavItems = [
    {
      id: "inbox",
      icon: Inbox,
      label: "Inbox",
      hint: "Messages",
      page: "inbox",
      badge: unreadCount > 0 ? unreadCount : notificationCount > 0 ? notificationCount : null,
      roles: ["founder", "team-member", "team", "talent"],
    },
    {
      id: "my-performance",
      icon: Award,
      label: "Performance",
      hint: "Delivery",
      page: "my-performance",
      badge: null,
      roles: ["team-member", "team"],
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      hint: "Trends",
      page: "analytics",
      badge: null,
      roles: ["founder"],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      hint: "Preferences",
      page: "settings",
      badge: null,
      roles: ["founder", "team-member", "team", "talent", "organization-admin"],
    },
  ];

  const utilityNavItems = allUtilityNavItems.filter((item) =>
    item.roles.includes(user.role),
  );

  const isActive = (item) => {
    if (item.page && item.view) {
      return currentPage === item.page && virtualOfficeView === item.view;
    }
    return currentPage === item.page;
  };

  const handleNavClick = (item) => {
    if (item.page) {
      onPageChange(item.page);
    }
    if (item.view && onVirtualOfficeViewChange) {
      onVirtualOfficeViewChange(item.view);
    }
    if (onClose) {
      onClose();
    }
  };

  const roleLabel = {
    founder: "Founder",
    "team-member": "Team Member",
    team: "Team Member",
    talent: "Talent",
    "organization-admin": "Organization Admin",
  }[user.role] || "Member";

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <button
        type="button"
        data-tour={item.id}
        className={cn(
          "group relative w-full rounded-xl px-2.5 py-2 text-left transition-all duration-200",
          "hover:translate-x-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
          active
            ? "border border-blue-200/80 bg-blue-50 text-blue-700 shadow-[0_2px_8px_rgba(30,64,255,0.14)] dark:border-blue-800/60 dark:bg-blue-950/35 dark:text-blue-200"
            : "text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-[0_1px_2px_rgba(15,23,42,0.08)]",
        )}
        onClick={() => handleNavClick(item)}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
              active
                ? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/45 dark:text-blue-100"
                : "border-border/60 bg-muted/40 text-muted-foreground group-hover:bg-muted/80",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-5">
              {item.label}
            </span>
            {item.hint ? (
              <span className="block truncate text-[11px] text-muted-foreground/85">
                {item.hint}
              </span>
            ) : null}
          </span>
        </div>
        <span className="absolute right-2 top-2 flex items-center gap-1">
          {item.badge ? (
            <Badge
              variant={item.id === "inbox" ? "destructive" : "default"}
              className="h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none"
            >
              {item.badge}
            </Badge>
          ) : null}
          {active ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> : null}
        </span>
      </button>
    );
  };

  return (
    <>
      {isOpen && onClose ? (
        <div className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={onClose} />
      ) : null}
      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-[16.75rem] flex-col border-r border-border/60",
          "bg-background/95 backdrop-blur",
          "transition-transform duration-300 ease-out md:static md:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="p-3">
          <div className="rounded-2xl border border-blue-700/20 bg-blue-600 p-3 text-white shadow-[0_8px_24px_rgba(30,64,255,0.22)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/35">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold leading-5">StartupVerse</p>
                  <p className="text-[11px] text-blue-100/95">Execution OS</p>
                </div>
              </div>
              {isOpen && onClose ? (
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white md:hidden"
                  onClick={onClose}
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-white/15 px-2 py-1.5 text-[11px]">
              <span className="text-blue-100/95">Workspace</span>
              <span className="rounded-full bg-white/25 px-2 py-0.5 font-semibold text-white">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <Separator className="opacity-70" />

        <div className="flex-1 overflow-y-auto px-2.5 py-3">
          <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-border/60 bg-card/70 p-2 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
            <nav className="space-y-1.5">
              {primaryNavItems.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
            </nav>

            <div className="my-3 flex items-center gap-2 px-1">
              <span className="h-px flex-1 bg-border/70" />
              <span className="h-1 w-1 rounded-full bg-blue-500/70" />
              <span className="h-px flex-1 bg-border/70" />
            </div>

            <div className="mt-auto space-y-1.5 pb-1">
              {utilityNavItems.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
