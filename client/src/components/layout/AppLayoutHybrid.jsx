import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { persistCurrentUser } from "../../app/session";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import ThemeToggle from "../ThemeToggle";
import VerticalSidebar from "./VerticalSidebar";
import NotificationCenter from "../notifications/NotificationCenter";
import { MobileActionDock, PageHeader, PageViewport } from "../shell";
import {
  LogOut,
  ChevronDown,
  Users,
  Rocket,
  Briefcase,
  UsersRound,
  UserCheck,
  Building,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  getSentInterests,
  getReceivedInterests,
  getSentInvitations,
  getReceivedInvitations,
} from "../../utils/api/inboxApi";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

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
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [sidebarMixCount, setSidebarMixCount] = useState(0);
  const [hasSentInterest, setHasSentInterest] = useState(false);
  const pageMeta = resolvePageMeta(currentPage, user.role);
  const normalizedPage = String(currentPage || "dashboard").split(":")[0];
  const isInboxPage = normalizedPage === "inbox";
  const isTeamDashboardPage =
    normalizedPage === "dashboard" &&
    (user.role === "team-member" || user.role === "team");
  const isWorkspacePage =
    currentPage === "startup-office" ||
    currentPage === "talent-chat" ||
    currentPage === "founder-chat";

  useEffect(() => {
    const fetchInboxCount = async () => {
      try {
        if (user.role === "talent") {
          const invitationsRes = await fetch(
            `${API_BASE_URL}/invitations/received/${user.id}`,
            {
             ...defaultOptions,
                          },
          );
          if (!invitationsRes.ok) {
            setUnreadMessagesCount(0);
            return;
          }
          const invitationsData = await invitationsRes.json();
          const pendingInvitations =
            invitationsData.invitations?.filter(
              (inv) => inv.status === "pending",
            ) || [];
          setUnreadMessagesCount(pendingInvitations.length);
        } else if (user.role === "founder") {
          const interestsRes = await fetch(
            `${API_BASE_URL}/interests/received/${user.id}`,
            {
             ...defaultOptions,
                          },
          );
          if (!interestsRes.ok) {
            setUnreadMessagesCount(0);
            return;
          }
          const interestsData = await interestsRes.json();
          const pendingInterests =
            interestsData.interests?.filter((item) => item.status === "pending") || [];

          const orgInvitationsRes = await fetch(
            `${API_BASE_URL}/invitations/founder/${user.id}`,
            {
             ...defaultOptions,
                          },
          );
          let pendingOrgInvitations = 0;
          if (orgInvitationsRes.ok) {
            const orgInvitationsData = await orgInvitationsRes.json();
            const pendingOrg =
              orgInvitationsData.invitations?.filter(
                (inv) => inv.status === "pending",
              ) || [];
            pendingOrgInvitations = pendingOrg.length;
          }
          setUnreadMessagesCount(pendingInterests.length + pendingOrgInvitations);
        } else if (user.role === "team-member") {
          const invitationsRes = await fetch(
            `${API_BASE_URL}/invitations/received/${user.id}`,
            {
             ...defaultOptions,
                          },
          );
          if (!invitationsRes.ok) {
            setUnreadMessagesCount(0);
            return;
          }
          const invitationsData = await invitationsRes.json();
          const pendingInvitations =
            invitationsData.invitations?.filter(
              (inv) => inv.status === "pending",
            ) || [];
          setUnreadMessagesCount(pendingInvitations.length);
        }
      } catch {
        setUnreadMessagesCount(0);
      }
    };

    fetchInboxCount();
  }, [user.id, user.role]);

  useEffect(() => {
    let cancelled = false;
    const uid = String(user._id ?? user.id ?? "");
    (async () => {
      if (!uid || (user.role !== "talent" && user.role !== "founder")) {
        if (!cancelled) setSidebarMixCount(0);
        return;
      }
      try {
        if (user.role === "talent") {
          const [recvInv, sentInt] = await Promise.all([
            getReceivedInvitations(uid),
            getSentInterests(uid),
          ]);
          if (cancelled) return;
          const pendInv =
            recvInv.filter((i) => String(i?.status || "") === "pending")
              .length || 0;
          const respondedInt =
            sentInt.filter((i) => String(i?.status || "") !== "pending")
              .length || 0;
          setSidebarMixCount(pendInv + respondedInt);
          return;
        }
        const [recvInt, sentInv] = await Promise.all([
          getReceivedInterests(uid),
          getSentInvitations(uid),
        ]);
        if (cancelled) return;
        const pendInt =
          recvInt.filter((i) => String(i?.status || "") === "pending").length ||
          0;
        const respondedInv =
          sentInv.filter((i) => String(i?.status || "") !== "pending").length ||
          0;
        setSidebarMixCount(pendInt + respondedInv);
      } catch {
        if (!cancelled) setSidebarMixCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, user.role, user._id]);

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

  const getRoleIcon = (role) => {
    const icons = {
      founder: Rocket,
      "team-member": Users,
      talent: UsersRound,
      mentor: Users,
      investor: Users,
      freelancer: Briefcase,
      "organization-admin": Building,
    };
    return icons[role] || Building;
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="flex h-screen bg-background">
      {user.role !== "organization-admin" && (
        <VerticalSidebar
          user={user}
          currentPage={currentPage}
          virtualOfficeView={virtualOfficeView}
          onPageChange={onPageChange}
          onVirtualOfficeViewChange={onVirtualOfficeViewChange}
          unreadCount={unreadMessagesCount}
          notificationCount={sidebarMixCount}
          talentDashboardMode={talentDashboardMode}
          hasSentInterest={hasSentInterest}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className={
            isInboxPage || isTeamDashboardPage
              ? "z-50 border-b border-[#e2e4f0] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-in-out"
              : "z-50 border-b border-surface-border bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-in-out"
          }
        >
          <PageViewport>
            {user.role === "organization-admin" ? (
              <div className="flex items-center gap-3 py-2">
                <h1 className="text-headline-small text-primary">StartupVerse</h1>
              </div>
            ) : (
              <PageHeader
                variant="appBar"
                title={pageMeta.title}
                description={pageMeta.description}
                titleClassName={
                  isInboxPage || isTeamDashboardPage
                    ? "truncate font-heading text-sm font-bold text-[#0d0d0d]"
                    : undefined
                }
                descriptionClassName={
                  isInboxPage || isTeamDashboardPage
                    ? "truncate font-body text-xs font-normal text-[#4a4a5a]"
                    : undefined
                }
                leading={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 md:hidden transition-colors duration-200 ease-in-out [&_svg]:text-text-body"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                }
                actions={
                  <>
                    <div data-tour="theme-toggle">
                      <ThemeToggle
                        variant="ghost"
                        size="sm"
                        className="transition-colors duration-200 ease-in-out hover:bg-surface-page [&_svg]:text-text-body"
                      />
                    </div>
                    <NotificationCenter onNavigate={onPageChange} />
                    <div data-tour="profile-menu">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild={true}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-2 rounded-full bg-transparent px-2 transition-colors duration-200 ease-in-out hover:bg-surface-page"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.profile?.avatar} />
                            <AvatarFallback className="bg-primary font-body text-xs font-semibold text-primary-foreground">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="hidden h-3 w-3 text-text-body sm:block" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel className="text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{user.name}</span>
                            <span className="font-normal text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {!user.startupId && (
                          <>
                            <div className="mx-2 mb-2 rounded-md bg-primary/5 px-2 py-2">
                              <p className="mb-1 text-xs text-muted-foreground">
                                <strong>Solo Mode Active</strong>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Find a co-founder to unlock team collaboration features.
                              </p>
                            </div>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => onPageChange("settings")}
                          className="text-xs"
                        >
                          Settings
                        </DropdownMenuItem>
                        {showDevRoleSwitcher ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <RoleIcon className="h-3.5 w-3.5" />
                                Dev Tools - Switch Role
                              </span>
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => switchRole("founder")}
                              className="text-xs"
                              disabled={user.role === "founder"}
                            >
                              <Rocket className="mr-2 h-3 w-3" />
                              {"Founder "}
                              {user.role === "founder" && "OK"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => switchRole("talent")}
                              className="text-xs"
                              disabled={user.role === "talent"}
                            >
                              <Users className="mr-2 h-3 w-3" />
                              {"Talent "}
                              {user.role === "talent" && "OK"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => switchRole("team-member")}
                              className="text-xs"
                              disabled={user.role === "team-member"}
                            >
                              <UserCheck className="mr-2 h-3 w-3" />
                              {"Team Member "}
                              {user.role === "team-member" && "OK"}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={onLogout}
                          className="text-xs text-destructive"
                        >
                          <LogOut className="mr-2 h-3 w-3" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                }
              />
            )}
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
