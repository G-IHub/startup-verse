/**
 * ORGANIZATION SIDEBAR NAVIGATION
 * Narrow icon-rail sidebar styled to match the Talent/Founder/Team-mate
 * design language (brand gradient logo disc, primary-tint hover, primary
 * accent bar + ring on the active item, soft right-edge shadow).
 *
 * Mobile-responsive with drawer pattern. Prop API is unchanged.
 */
import React from "react";
import { Button } from "../ui/button";
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
  LogOut,
  X,
  Sparkles,
} from "lucide-react";

function formatNavBadge(n) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return undefined;
  return v > 99 ? "99+" : v;
}

export default function OrganizationSidebar({
  currentPage,
  onPageChange,
  organizationName,
  cohortName,
  userName,
  stats,
  badgeCounts,
  onLogout,
  isOpen,
  onClose,
}) {
  const handleNavClick = (page) => {
    onPageChange(page);
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  const communicationBadge =
    (badgeCounts?.unreadMessages ?? 0) + (badgeCounts?.newAnnouncements ?? 0);

  const primaryNavItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "portfolio", label: "Portfolio", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { id: "milestones", label: "Milestones", icon: Target },
    {
      id: "deliverables",
      label: "Deliverables",
      icon: FileText,
      badge: formatNavBadge(badgeCounts?.pendingSubmissions),
    },
    {
      id: "events",
      label: "Agenda",
      icon: Calendar,
      badge: formatNavBadge(badgeCounts?.upcomingEventsNext7d),
    },
    {
      id: "communication",
      label: "Communication",
      icon: Bell,
      badge: formatNavBadge(communicationBadge),
    },
    { id: "mentors", label: "Mentors", icon: UserPlus },
    { id: "resources", label: "Library", icon: BookOpen },
    {
      id: "members",
      label: "Members",
      icon: Users,
      badge: formatNavBadge(stats?.totalStartups),
    },
  ];

  const utilityNavItems = [{ id: "settings", label: "Settings", icon: Settings }];

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const active = currentPage === item.id;
    const displayBadge = item.badge;
    return (
      <button
        type="button"
        onClick={() => handleNavClick(item.id)}
        className={cn(
          "relative w-full flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-input transition-all duration-200 ease-in-out",
          active
            ? "bg-[rgba(58,90,254,0.15)] text-primary"
            : "text-white/45 hover:bg-white/[0.06] hover:text-white/85",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r-pill" />
        )}
        <Icon className="w-4 h-4" />
        <span className="font-body text-[11px] font-medium leading-tight text-center">
          {item.label}
        </span>
        {displayBadge !== undefined && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-white font-body text-[11px] font-semibold leading-none border-2 border-primary-dark">
            {displayBadge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "w-24 bg-primary-dark flex flex-col h-screen",
          "fixed md:static left-0 top-0 z-50",
          "shadow-[2px_0_12px_rgba(26,35,126,0.10)]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-3 flex items-center justify-center">
          <div className="w-10 h-10 rounded-[10px] bg-primary flex items-center justify-center shadow-[0_4px_16px_rgba(58,90,254,0.25)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {primaryNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
          {secondaryNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>
        <div className="px-2 py-2 space-y-0.5 border-t border-white/10">
          {utilityNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                if (onClose && window.innerWidth < 768) {
                  onClose();
                }
              }}
              className="relative w-full flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-input transition-all duration-200 ease-in-out text-white/45 hover:bg-white/[0.06] hover:text-[#ffb4c0]"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-body text-[11px] font-medium leading-tight text-center">
                Sign out
              </span>
            </button>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 md:hidden"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </aside>
    </>
  );
}
