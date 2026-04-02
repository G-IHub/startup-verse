/**
 * ORGANIZATION SIDEBAR NAVIGATION
 * Clean vertical sidebar matching founder dashboard style
 * Compact icon-based navigation with labels
 * Mobile-responsive with drawer pattern
 */
import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
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
export default function OrganizationSidebar({
  currentPage,
  onPageChange,
  organizationName,
  cohortName,
  userName,
  stats,
  onLogout,
  isOpen,
  onClose,
}) {
  const handleNavClick = (page) => {
    onPageChange(page);
    // Auto-close on mobile after navigation
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  // Primary navigation items
  const primaryNavItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Activity,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
    },
  ];

  // Secondary navigation items
  const secondaryNavItems = [
    {
      id: "milestones",
      label: "Milestones",
      icon: Target,
    },
    {
      id: "deliverables",
      label: "Deliverables",
      icon: FileText,
    },
    {
      id: "events",
      label: "Agenda",
      icon: Calendar,
    },
    {
      id: "communication",
      label: "Communication",
      icon: Bell,
    },
    {
      id: "mentors",
      label: "Mentors",
      icon: UserPlus,
    },
    {
      id: "resources",
      label: "Library",
      icon: BookOpen,
    },
    {
      id: "members",
      label: "Members",
      icon: Users,
      badge: stats?.totalStartups,
    },
  ];

  // Utility navigation items
  const utilityNavItems = [
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];
  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const active = currentPage === item.id;
    return (
      <button
        className={`w-full flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 relative group ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
        onClick={() => handleNavClick(item.id)}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
        )}
        <Icon className={`w-5 h-5 mb-1 ${active ? "text-primary" : ""}`} />
        <span className="text-[10px] leading-tight text-center">
          {item.label}
        </span>
        {item.badge !== undefined && (
          <Badge
            variant="default"
            className="absolute -top-0.5 -right-0.5 text-[9px] flex items-center justify-center rounded-full w-4 h-4 p-0"
          >
            {item.badge}
          </Badge>
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
        className={`
        w-24 bg-background/95 border-r border-border flex flex-col h-screen
        fixed md:static left-0 top-0 z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="p-4 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <Separator />
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {primaryNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
          <Separator className="my-2" />
          {secondaryNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>
        <Separator />
        <div className="px-2 py-4 space-y-1">
          {utilityNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
          {onLogout && (
            <button
              className="w-full flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[10px] leading-tight text-center">
                Logout
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
