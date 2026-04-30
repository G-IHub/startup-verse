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
  X,
  MessageCircle,
} from "lucide-react";

export default function VerticalSidebar({
  user,
  currentPage,
  virtualOfficeView,
  onPageChange,
  onVirtualOfficeViewChange,
  unreadCount = 0,
  notificationCount = 0,
  talentDashboardMode = "overview",
  hasSentInterest = false,
  isOpen = false,
  onClose,
}) {
  const allNavItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Home",
      page: "dashboard",
      badge: null,
      roles: ["founder", "team-member", "team", "talent", "organization-admin"],
    },
    {
      id: "virtual-office",
      icon: Building,
      label: "Office",
      page: "startup-office",
      view: "workspace",
      badge: null,
      roles: ["founder", "team-member", "team"],
    },
    {
      id: user.role === "talent" ? "browse" : "browse",
      icon: Users,
      label: user.role === "talent" ? "Browse" : "Browse",
      page: user.role === "talent" ? "team-matching" : "startup-office",
      view: user.role === "talent" ? undefined : "matching",
      badge: null,
      roles: ["founder", "talent"],
    },
    // Chat icon — only for talents who have sent at least one interest
    ...(user.role === "talent" && hasSentInterest
      ? [{
          id: "talent-chat",
          icon: MessageCircle,
          label: "Chat",
          page: "talent-chat",
          badge: null,
          roles: ["talent"],
        }]
      : []),
    // Chat icon for founders and team members
    ...(user.role === "founder" || user.role === "team-member" || user.role === "team"
      ? [{
          id: "founder-chat",
          icon: MessageCircle,
          label: "Chat",
          page: "founder-chat",
          badge: null,
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
      badge: unreadCount > 0 ? unreadCount : notificationCount > 0 ? notificationCount : null,
      roles: ["founder", "team-member", "team", "talent"],
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      page: "analytics",
      badge: null,
      roles: ["founder"],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      page: "settings",
      badge: null,
      roles: ["founder", "team-member", "team", "talent", "organization-admin"],
    },
  ];

  const utilityNavItems = allUtilityNavItems.filter((item) =>
    item.roles.includes(user.role),
  );

  const isActive = (item) => {
    if (user.role === "talent" && item.id === "browse") {
      return currentPage === "team-matching";
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
      onPageChange(item.page, item.options);
    }
    if (item.view && onVirtualOfficeViewChange) {
      onVirtualOfficeViewChange(item.view);
    }
    if (onClose) {
      onClose();
    }
  };

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <button
        type="button"
        data-tour={item.id}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
          active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-200" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        )}
        onClick={() => handleNavClick(item)}
      >
        {active ? (
          <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
        ) : null}
        <span
          className={cn(
            "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
            active ? "bg-blue-100 text-blue-700 dark:bg-blue-900/45 dark:text-blue-100" : "bg-muted/40 text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground",
          )}
        >
          <Icon className="h-6 w-6" />
          {item.badge ? (
            <span className="absolute -right-1 -top-1">
              <Badge
                variant={item.id === "inbox" ? "destructive" : "default"}
                className="h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none"
              >
                {item.badge}
              </Badge>
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 max-w-[72px] truncate text-[12px] font-medium leading-4">
          {item.label}
        </span>
        <span className="absolute right-2 top-2 flex items-center gap-1">
          {item.badge ? (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70" />
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
          "fixed left-0 top-0 z-50 flex h-screen w-24 flex-col bg-background/95 backdrop-blur",
          "transition-transform duration-300 ease-out md:static",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="relative flex items-center justify-center px-2 py-3">
          <button
            type="button"
            className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(30,64,255,0.22)] ring-1 ring-blue-200/40 dark:ring-blue-800/40"
            aria-label="StartupVerse"
          >
            <Sparkles className="h-6 w-6" />
          </button>
          {isOpen && onClose ? (
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-foreground md:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <Separator className="opacity-70" />

        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex h-full flex-col">
          <nav className="space-y-1">
            {primaryNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>

          <div className="my-4 flex items-center justify-center">
            <span className="h-px w-14 bg-border/70" />
          </div>

          <div className="mt-auto space-y-1 pb-3">
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
