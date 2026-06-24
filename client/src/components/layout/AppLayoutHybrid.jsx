import React, { useEffect, useState } from "react";
import { persistCurrentUser } from "../../app/session";
import { Button } from "../ui/button";
import { toast } from "sonner";
import VerticalSidebar from "./VerticalSidebar";
import NotificationCenter from "../notifications/NotificationCenter";
import { MobileActionDock, PageViewport } from "../shell/PageScaffold";
import { Menu } from "lucide-react";
import HeaderProfileMenu from "./HeaderProfileMenu";
import {
  getSentInterests
} from "../../utils/api/inboxApi";
import { usePresenceSession } from "../../domains/presence/usePresenceSession";
import { useNotifications } from "../../contexts/NotificationContext";

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
  inbox: {
    title: "Inbox",
    description: "Invitations, interests, and responses",
  },
  analytics: {
    title: "Analytics",
    description: "Execution trends and diagnostics",
  },
  settings: {
    title: "Settings",
    description: "Profile, preferences, and account controls",
  },
  "talent-chat": {
    title: "My Chats",
    description: "Conversations with startups you expressed interest in",
  },
  "founder-chat": {
    title: "Team Chat",
    description: "Messages with team members and interested talents",
  },
  "my-performance": {
    title: "My Performance",
    description: "Tasks, progress, and delivery trends",
  },
};

function resolvePageMeta(currentPage, userRole) {
  const normalizedPage = String(currentPage || "dashboard").split(":")[0];
  const base = PAGE_META[normalizedPage] || PAGE_META.dashboard;

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
  projectSlug,
  milestoneId,
  projectTaskId,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasSentInterest, setHasSentInterest] = useState(false);
  const { unreadCount: notificationUnreadCount = 0 } = useNotifications();
  const pageMeta = resolvePageMeta(currentPage, user.role);
  const normalizedPage = String(currentPage || "dashboard").split(":")[0];
  const isInboxPage = normalizedPage === "inbox";
  const isTeamDashboardPage =
    normalizedPage === "dashboard" &&
    (user.role === "team-member" || user.role === "team");
  const isWorkspacePage =
    currentPage === "startup-office" ||
    currentPage === "talent-chat" ||
    currentPage === "founder-chat" ||
    currentPage === "projects-workspace";

  usePresenceSession(user);

  useEffect(() => {
    if (user.role !== "talent") return;
    const talentId = String(user._id ?? user.id ?? "");
    if (!talentId) return;
    getSentInterests(talentId)
      .then((interests) => {
        setHasSentInterest(Array.isArray(interests) && interests.length > 0);
      })
      .catch(() => {});
  }, [user.id, user.role]);

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
          unreadCount={notificationUnreadCount}
          talentDashboardMode={talentDashboardMode}
          hasSentInterest={hasSentInterest}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          projectSlug={projectSlug}
          milestoneId={milestoneId}
          projectTaskId={projectTaskId}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-page">
        <header
          className={
            isInboxPage || isTeamDashboardPage
              ? "z-50 border-b border-[#e2e4f0] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-in-out"
              : "z-50 border-b border-surface-border bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-in-out"
          }
        >
          <PageViewport>
            <div className="flex items-center gap-3 py-2">
              {user.role === "organization-admin" ? (
                <h1 className="text-headline-small text-primary">StartupVerse</h1>
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
              {/* Page title/description are rendered inside page content.
                  Keeping them out of the shell header avoids duplicated headings
                  across Inbox, dashboards, chats, and other tabs. */}
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 sm:gap-2">
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
