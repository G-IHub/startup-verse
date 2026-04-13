import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { loadCurrentUser, persistCurrentUser } from "../../app/session";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import ThemeToggle from "../ThemeToggle";
import VerticalSidebar from "./VerticalSidebar";
import NotificationCenter from "../notifications/NotificationCenter";
// 🔥 REALTIME: Import unread count hook

import {
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Rocket,
  Briefcase,
  UsersRound,
  UserCheck,
  Sparkles,
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
import { getAccessToken } from "../../app/session";
export default function AppLayoutHybrid({
  user,
  children,
  onLogout,
  currentPage,
  onPageChange,
  virtualOfficeView,
  onVirtualOfficeViewChange,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Fetch real inbox count from backend
  useEffect(() => {
    const fetchInboxCount = async () => {
      try {
        if (user.role === "talent") {
          // Talent: Count received invitations
          const invitationsRes = await fetch(
            `${API_BASE_URL}/invitations/received/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (!invitationsRes.ok) {
            console.warn(
              "⚠️ [AppLayout] Failed to fetch invitations, status:",
              invitationsRes.status,
            );
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
          // Founders: Count received interests + organization invitations
          console.log(
            "🔍 [AppLayout] Fetching inbox count for founder:",
            user.id,
          );
          const interestsRes = await fetch(
            `${API_BASE_URL}/interests/received/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (!interestsRes.ok) {
            console.warn(
              "⚠️ [AppLayout] Failed to fetch interests, status:",
              interestsRes.status,
            );
            setUnreadMessagesCount(0);
            return;
          }
          const interestsData = await interestsRes.json();
          const pendingInterests =
            interestsData.interests?.filter(
              (int) => int.status === "pending",
            ) || [];
          console.log(
            "📊 [AppLayout] Pending interests:",
            pendingInterests.length,
          );

          // Also fetch organization invitations for founders
          const orgInvitationsRes = await fetch(
            `${API_BASE_URL}/invitations/founder/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
                "Content-Type": "application/json",
              },
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
            console.log(
              "📊 [AppLayout] Pending org invitations:",
              pendingOrgInvitations,
              "data:",
              pendingOrg,
            );
          } else {
            console.warn(
              "⚠️ [AppLayout] Failed to fetch org invitations, status:",
              orgInvitationsRes.status,
            );
          }
          const totalCount = pendingInterests.length + pendingOrgInvitations;
          console.log(
            "📊 [AppLayout] Total inbox count:",
            totalCount,
            "(interests:",
            pendingInterests.length,
            "+ org:",
            pendingOrgInvitations,
            ")",
          );
          setUnreadMessagesCount(totalCount);
        } else if (user.role === "team-member") {
          // Team members: Count pending invitations
          const invitationsRes = await fetch(
            `${API_BASE_URL}/invitations/received/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (!invitationsRes.ok) {
            console.warn(
              "⚠️ [AppLayout] Failed to fetch invitations, status:",
              invitationsRes.status,
            );
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
      } catch (error) {
        // Silently handle fetch errors during initial load
        // The interval will retry automatically
        setUnreadMessagesCount(0);
      }
    };
    fetchInboxCount();

    // ✅ REALTIME: Removed inbox count polling (was every 30s) - will use real-time subscription
  }, [user.id, user.role]);

  // Calculate notification count based on user role
  const getNotificationCount = () => {
    if (user.role === "talent") {
      // Talent receives invitations from founders
      const invitations = JSON.parse(
        localStorage.getItem("startupverse_sent_invitations") || "[]",
      );
      const myInvitations = invitations.filter(
        (inv) =>
          (inv.talentId === user.id || inv.talentName === user.name) &&
          inv.status === "pending",
      );

      // Talent also gets responses to their interests
      const interests = JSON.parse(
        localStorage.getItem("startupverse_sent_interests") || "[]",
      );
      const myResponses = interests.filter(
        (int) => int.sentById === user.id && int.status !== "pending",
      );
      return myInvitations.length + myResponses.length;
    } else if (user.role === "founder") {
      // Founders receive interests from talent
      const interests = JSON.parse(
        localStorage.getItem("startupverse_sent_interests") || "[]",
      );
      const myInterests = interests.filter(
        (int) => int.founderName === user.name && int.status === "pending",
      );

      // Founders also get responses to their invitations
      const invitations = JSON.parse(
        localStorage.getItem("startupverse_sent_invitations") || "[]",
      );
      const myResponses = invitations.filter(
        (inv) =>
          (inv.sentBy === user.name || inv.sentBy === user.id) &&
          inv.status !== "pending",
      );
      return myInterests.length + myResponses.length;
    }
    return 0;
  };
  const notificationCount = getNotificationCount();
  const switchRole = (newRole) => {
    const parsedUser = loadCurrentUser();
    if (!parsedUser) {
      toast.error("User data not found");
      return;
    }
    const updatedUser = {
      ...parsedUser,
      role: newRole,
      onboardingComplete: true,
    };
    persistCurrentUser(updatedUser);
    const roleName = {
      founder: "Founder",
      talent: "Talent",
      "team-member": "Team Member",
    };
    toast.success(`Switching to ${roleName[newRole]} view...`);
    setTimeout(() => window.location.reload(), 500);
  };
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
          notificationCount={notificationCount}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-background/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-3 z-50">
          <div className="flex items-center gap-4">
            {user.role === "organization-admin" ? (
              <h1 className="text-[16px] md:text-[18px] font-bold text-primary">
                StartupVerse
              </h1>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div data-tour="theme-toggle">
                <ThemeToggle
                  variant="ghost"
                  size="sm"
                  className="bg-muted/80 hover:bg-accent/20 transition-colors"
                />
              </div>
              <NotificationCenter onNavigate={onPageChange} />
              {user.role !== "organization-admin" && (
                <div data-tour="profile-menu">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild={true}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2 gap-2"
                      >
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={user.profile?.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{user.name}</span>
                          <span className="text-muted-foreground font-normal">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {!user.startupId && (
                        <>
                          <div className="px-2 py-2 bg-primary/5 rounded-md mx-2 mb-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              {"🚀 "}
                              <strong>Solo Mode Active</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Find a co-founder to unlock team collaboration
                              features!
                            </p>
                          </div>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => onPageChange("settings")}
                        className="text-xs"
                      >
                        <Settings className="w-3 h-3 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          localStorage.removeItem(
                            "tour_completed_homepage-welcome",
                          );
                          window.location.reload();
                        }}
                        className="text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-2" />
                        Replay Welcome Tour
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        🔧 Dev Tools - Switch Role
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => switchRole("founder")}
                        className="text-xs"
                        disabled={user.role === "founder"}
                      >
                        <Rocket className="w-3 h-3 mr-2" />
                        {"Founder "}
                        {user.role === "founder" && "✓"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => switchRole("talent")}
                        className="text-xs"
                        disabled={user.role === "talent"}
                      >
                        <Users className="w-3 h-3 mr-2" />
                        {"Talent "}
                        {user.role === "talent" && "✓"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => switchRole("team-member")}
                        className="text-xs"
                        disabled={user.role === "team-member"}
                      >
                        <UserCheck className="w-3 h-3 mr-2" />
                        {"Team Member "}
                        {user.role === "team-member" && "✓"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onLogout}
                        className="text-destructive text-xs"
                      >
                        <LogOut className="w-3 h-3 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
