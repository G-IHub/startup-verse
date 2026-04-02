import React from "react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Building,
  Users,
  Home,
  Sparkles,
  Settings,
  Inbox,
  BarChart3,
  Award,
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
  // Calculate profile completion for talent users
  const calculateProfileCompletion = () => {
    if (user.role !== "talent") return 100;
    const requiredFields = [
      user.name,
      user.email,
      user.professionalTitle,
      user.location,
      user.yearsOfExperience,
      user.bio,
      user.skills && user.skills.length > 0,
      user.linkedin,
      user.workExperience && user.workExperience.length > 0,
      user.availabilityStatus,
      user.preferredCommitment,
    ];
    const requiredCompleted = requiredFields.filter(
      (field) => field && field !== "",
    ).length;
    return Math.round((requiredCompleted / requiredFields.length) * 100);
  };
  const profileCompletion = calculateProfileCompletion();
  const showProfileBadge = user.role === "talent" && profileCompletion < 100;

  // Define all possible navigation items
  const allNavItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Home",
      page: "dashboard",
      badge: null,
      roles: ["founder", "team-member", "team", "talent", "organization-admin"], // Available to all roles
    },
    {
      id: "virtual-office",
      icon: Building,
      label: "Office",
      page: "startup-office",
      view: "workspace",
      badge: null,
      roles: ["founder", "team-member", "team"], // Only founders and team members have offices (team = backward compatibility)
    },
    // Journey removed from navigation - now embedded in execution flow
    {
      id: "team-matching",
      icon: Users,
      label: user.role === "talent" ? "Browse" : "Team",
      // ✅ UPDATED: "Browse" for talent, "Team" for founders
      page: "startup-office",
      view: "matching",
      badge: null,
      // ✅ REMOVED: No badge on Team page, only Inbox should have badges
      roles: ["founder", "talent"], // Founders find team members, Talent finds opportunities
    },
  ];

  // Filter navigation items based on user role
  const primaryNavItems = allNavItems.filter((item) =>
    item.roles.includes(user.role),
  );
  const allUtilityNavItems = [
    {
      id: "inbox",
      icon: Inbox,
      label: "Inbox",
      page: "inbox",
      badge: unreadCount > 0 ? unreadCount : null,
      roles: ["founder", "team-member", "team", "talent"], // All roles have inbox (team = backward compatibility)
    },
    {
      id: "my-performance",
      icon: Award,
      label: "Performance",
      page: "my-performance",
      badge: null,
      roles: ["team-member", "team"], // Only team members see performance (team = backward compatibility)
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      page: "analytics",
      badge: null,
      roles: ["founder"], // Only founders see analytics
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      page: "settings",
      badge: null,
      roles: ["founder", "team-member", "team", "talent", "organization-admin"], // All roles have settings
    },
  ];

  // Filter utility navigation items based on user role
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
    if (item.action) {
      item.action();
    } else {
      if (item.page) {
        onPageChange(item.page);
      }
      if (item.view && onVirtualOfficeViewChange) {
        onVirtualOfficeViewChange(item.view);
      }
    }
    // Close mobile menu after navigation
    if (onClose) {
      onClose();
    }
  };
  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <button
        data-tour={item.id}
        className={`w-full flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 relative group ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
        onClick={() => handleNavClick(item)}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
        )}
        <Icon className={`w-5 h-5 mb-1 ${active ? "text-primary" : ""}`} />
        <span className="text-[10px] leading-tight text-center">
          {item.label}
        </span>
        {item.badge && (
          <Badge
            variant={
              item.id === "profile" && showProfileBadge
                ? "destructive"
                : item.id === "inbox"
                  ? "destructive"
                  : "default"
            }
            className={`absolute -top-0.5 -right-0.5 text-[9px] flex items-center justify-center rounded-full ${item.id === "profile" && showProfileBadge ? "w-auto h-4 px-1 min-w-[20px] bg-yellow-500 hover:bg-yellow-600" : item.id === "inbox" ? "w-4 h-4 p-0 bg-red-500 hover:bg-red-600" : "w-4 h-4 p-0"}`}
          >
            {item.id === "profile" && showProfileBadge
              ? `${item.badge}%`
              : item.badge}
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
        w-20 bg-background/95 border-r border-border flex flex-col h-screen
        fixed md:static left-0 top-0 z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="p-3 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <Separator />
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {primaryNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>
        <Separator />
        <div className="px-2 py-4 space-y-1">
          {utilityNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </aside>
    </>
  );
}
