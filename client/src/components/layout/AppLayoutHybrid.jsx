import React, { useState } from "react";
import { persistCurrentUser } from "../../app/session";
import { Button } from "../ui/button";
import { toast } from "sonner";
import VerticalSidebar from "./VerticalSidebar";
import NotificationCenter from "../notifications/NotificationCenter";
import { MobileActionDock, PageViewport } from "../shell/PageScaffold";
import { Menu, SlidersHorizontal, UserCircle } from "lucide-react";
import HeaderProfileMenu from "./HeaderProfileMenu";
import StartupVerseLogo from "../brand/StartupVerseLogo";
import { usePresenceSession } from "../../domains/presence/usePresenceSession";

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    description: "Execution overview and key actions",
  },
  "startup-office": {
    title: "Virtual Office",
    description: "Live startup workspace",
  },
  "team-matching": {
    title: "Browse Talent",
    description: "Discover talent that can grow into your team",
  },
  "browse-startups": {
    title: "Browse Startups",
    description: "Discover startup opportunities that match your skills",
  },
  analytics: {
    title: "Analytics",
    description: "Execution trends and diagnostics",
  },
  settings: {
    title: "Settings",
    description: "Account preferences and controls",
  },
  profile: {
    title: "Profile",
    description: "Edit your public profile and account details",
  },
  documents: {
    title: "Documents & Templates",
    description: "Professional documents to help you build and grow",
  },
  "pitch-deck": {
    title: "Pitch Deck",
    description: "Create and refine investor-ready materials",
  },
  journey: {
    title: "Startup Journey",
    description: "Navigate your startup roadmap",
  },
  ideation: {
    title: "Ideation & Validation",
    description: "Validate the problem, customer, and solution",
  },
  formation: {
    title: "Company Formation",
    description: "Set up your company foundations",
  },
  "team-building": {
    title: "Team Building",
    description: "Build and coordinate your founding team",
  },
  "product-dev": {
    title: "Product Development",
    description: "Shape and ship your product",
  },
  "go-to-market": {
    title: "Go To Market",
    description: "Plan launch, acquisition, and growth",
  },
  operations: {
    title: "Operations",
    description: "Run repeatable systems and execution rhythms",
  },
  "talent-chat": {
    title: "My Chats",
    description: "Conversations with startups you expressed interest in",
  },
  "founder-chat": {
    title: "Team Chat",
    description: "Messages with team members and interested talents",
  },
  "post-startup": {
    title: "Launch Startup",
    description: "Publish your startup to browse and invite talent",
  },
  "my-performance": {
    title: "My Performance",
    description: "Tasks, progress, and delivery trends",
  },
  "startup-detail": {
    title: "Startup Detail",
    description: "Review opportunity details and team context",
  },
  "talent-profile": {
    title: "Talent Profile",
    description: "Review skills, background, and invitation fit",
  },
  "compensation-demo": {
    title: "Compensation Demo",
    description: "Preview compensation setup workflows",
  },
};

function resolvePageMeta(currentPage, userRole) {
  const pageKey = String(currentPage || "dashboard");
  const normalizedPage = pageKey.split(":")[0];
  const base = PAGE_META[pageKey] || PAGE_META[normalizedPage] || PAGE_META.dashboard;

  if (normalizedPage === "dashboard") {
    if (userRole === "founder") {
      return {
        title: "Founder Dashboard",
        description: "Run the weekly execution loop with clarity",
      };
    }
    if (userRole === "team-member" || userRole === "team") {
      return {
        title: "Team Dashboard",
        description: "Track assigned work and daily progress",
      };
    }
    if (userRole === "talent") {
      return {
        title: "Talent Dashboard",
        description: "Discover opportunities and track applications",
      };
    }
    if (userRole === "organization-admin") {
      return {
        title: "Organization Dashboard",
        description: "Manage cohorts and portfolio activity",
      };
    }
  }

  return base;
}

export default function AppLayoutHybrid({
  user,
  children,
  onLogout,
  currentPage,
  onPageChange,
  virtualOfficeView,
  onVirtualOfficeViewChange,
  talentDashboardMode = "overview",
  mobileActions = null,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageMeta = resolvePageMeta(currentPage, user.role);
  const normalizedPage = String(currentPage || "dashboard").split(":")[0];
  const isTeamDashboardPage =
    normalizedPage === "dashboard" &&
    (user.role === "team-member" || user.role === "team");
  const isWorkspacePage =
    currentPage === "startup-office" ||
    currentPage === "talent-chat" ||
    currentPage === "founder-chat";
  const showSettingsSwitcher =
    normalizedPage === "settings" || normalizedPage === "profile";

  usePresenceSession(user);

  const switchRole = (newRole) => {
    if (!user) {
      toast.error("User data not found");
      return;
    }

    persistCurrentUser({
      ...user,
      role: newRole,
      onboardingComplete: true,
    });

    const roleName = {
      founder: "Founder",
      talent: "Talent",
      "team-member": "Team Member",
    };
    toast.success(`Switching to ${roleName[newRole]} view...`);
    setTimeout(() => window.location.reload(), 500);
  };

  const showDevRoleSwitcher = Boolean(import.meta?.env?.DEV);

  return (
    <div className="flex h-screen bg-background">
      {user.role !== "organization-admin" && (
        <VerticalSidebar
          user={user}
          currentPage={currentPage}
          virtualOfficeView={virtualOfficeView}
          onPageChange={onPageChange}
          onVirtualOfficeViewChange={onVirtualOfficeViewChange}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-page">
        <header
          className={
            isTeamDashboardPage
              ? "z-50 border-b border-[#e2e4f0] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-in-out"
              : "z-50 border-b border-surface-border bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-in-out"
          }
        >
          <PageViewport>
            <div className="flex min-h-[82px] items-center gap-3 py-4">
              {user.role === "organization-admin" ? (
                <StartupVerseLogo className="h-8" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 md:hidden transition-colors duration-200 ease-in-out [&_svg]:text-text-body"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-heading text-lg font-extrabold leading-tight text-text-heading sm:text-xl">
                  {pageMeta.title}
                </h1>
                {pageMeta.description ? (
                  <p className="hidden truncate font-body text-xs leading-snug text-text-body sm:block">
                    {pageMeta.description}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {showSettingsSwitcher ? (
                  <div className="flex items-center gap-1 rounded-input border border-surface-border bg-surface-page p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onPageChange("profile")}
                      className={`h-8 gap-2 rounded-input px-2 font-body text-xs font-semibold sm:px-3 ${
                        normalizedPage === "profile"
                          ? "bg-surface-card text-primary shadow-sm"
                          : "text-text-body hover:bg-surface-card hover:text-text-heading"
                      }`}
                    >
                      <UserCircle className="h-4 w-4" />
                      <span className="hidden md:inline">Profile</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onPageChange("settings")}
                      className={`h-8 gap-2 rounded-input px-2 font-body text-xs font-semibold sm:px-3 ${
                        normalizedPage === "settings"
                          ? "bg-surface-card text-primary shadow-sm"
                          : "text-text-body hover:bg-surface-card hover:text-text-heading"
                      }`}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                  </div>
                ) : null}
                <NotificationCenter onNavigate={onPageChange} />
                {user.role !== "organization-admin" ? (
                  <HeaderProfileMenu
                    user={user}
                    onPageChange={onPageChange}
                    onLogout={onLogout}
                    showDevRoleSwitcher={showDevRoleSwitcher}
                    onSwitchRole={switchRole}
                  />
                ) : null}
              </div>
            </div>
          </PageViewport>
        </header>
        <main className="flex-1 overflow-auto">
          {isWorkspacePage ? children : <PageViewport>{children}</PageViewport>}
        </main>
        <MobileActionDock>{mobileActions}</MobileActionDock>
      </div>
    </div>
  );
}
