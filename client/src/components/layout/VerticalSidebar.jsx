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
          "group relative mx-1 flex w-[calc(100%-0.5rem)] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-center transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/45",
          active
            ? "bg-[rgba(58,90,254,0.12)] text-white before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']"
            : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.85)]",
        )}
        onClick={() => handleNavClick(item)}
      >
        <span
          className={cn(
            "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ease-in-out",
            active
              ? "bg-transparent text-white"
              : "bg-transparent text-[rgba(255,255,255,0.45)] group-hover:bg-white/[0.06] group-hover:text-[rgba(255,255,255,0.85)]",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {item.badge ? (
            <span className="absolute -right-0.5 -top-0.5 flex">
              <Badge
                variant={item.id === "inbox" ? "destructive" : "default"}
                className="flex h-4 min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none"
              >
                {item.badge}
              </Badge>
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "max-w-[4.25rem] truncate text-[10px] font-medium leading-tight tracking-wide transition-colors duration-200 ease-in-out",
            active
              ? "text-white"
              : "text-[rgba(255,255,255,0.45)] group-hover:text-[rgba(255,255,255,0.85)]",
          )}
        >
          {item.label}
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
          "fixed left-0 top-0 z-50 flex h-screen w-24 flex-col bg-primary-dark shadow-[2px_0_12px_rgba(26,35,126,0.10)]",
          "transition-transform duration-300 ease-out md:static",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="relative flex items-center justify-center px-2 py-2">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-none transition-opacity duration-200 ease-in-out hover:bg-primary-hover hover:opacity-100"
            aria-label="StartupVerse"
          >
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          {isOpen && onClose ? (
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 ease-in-out hover:bg-white/15 md:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <Separator className="bg-white/10" />

        <div className="flex-1 overflow-y-auto py-1.5">
          <div className="flex h-full flex-col">
          <nav className="space-y-0.5">
            {primaryNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>

          <div className="my-3 flex items-center justify-center px-2">
            <span className="h-px w-12 bg-white/10" />
          </div>

          <div className="mt-auto space-y-0.5 pb-2">
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
