/**
 * DashboardHybrid - Main dashboard router component
 * Handles routing between different views based on user role
 */
import React, { useState, lazy, Suspense, useCallback, useMemo } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  pathToDashboardState,
  dashboardStateToPath,
} from "../app/dashboardPaths";
import AppLayoutHybrid from "./layout/AppLayoutHybrid";
import AdaptiveVirtualOffice from "./office/AdaptiveVirtualOffice";
// ⚡ LAZY LOAD HEAVY COMPONENTS - Only load when navigating to them
const FounderDashboard = lazy(() => import("./dashboards/FounderDashboard"));
const TeamMemberDashboard = lazy(
  () => import("./dashboards/TeamMemberDashboard"),
);
const TalentDashboard = lazy(() => import("./dashboards/TalentDashboard"));
const OrganizationDashboard = lazy(
  () => import("./dashboards/OrganizationDashboard"),
);
const AnalyticsDashboard = lazy(() => import("./analytics/AnalyticsDashboard"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));

// ⚡ LAZY LOAD STAGE COMPONENTS
const FounderJourney = lazy(() => import("./FounderJourney"));
const IdeationValidation = lazy(() => import("./stages/IdeationValidation"));
const CompanyFormation = lazy(() => import("./stages/CompanyFormation"));
const TeamBuilding = lazy(() => import("./stages/TeamBuilding"));
const ProductDevelopment = lazy(() => import("./stages/ProductDevelopment"));
const GoToMarket = lazy(() => import("./stages/GoToMarket"));
const Operations = lazy(() => import("./stages/Operations"));

// ⚡ LAZY LOAD FEATURE PAGES
const DocumentsPage = lazy(() => import("./DocumentsPage"));
const PitchDeck = lazy(() => import("./PitchDeck"));
const TeamMatching = lazy(() => import("./TeamMatching"));
const Inbox = lazy(() => import("./Inbox"));
const MyPerformancePage = lazy(() => import("./team-member/MyPerformancePage"));
const CompensationDemoPage = lazy(
  () => import("./compensation/CompensationDemoPage"),
);
const AdminDebugIndicator = lazy(() =>
  import("./debug/AdminBadge").then((m) => ({
    default: m.AdminDebugIndicator,
  })),
);
const FounderDeliverablesView = lazy(
  () => import("./founders/FounderDeliverablesView"),
);
const TalentChatPage = lazy(() => import("./talent/TalentChatPage"));
const FounderChatPage = lazy(() => import("./office/FounderChatPage"));
const TalentProfilePage = lazy(() => import("./TalentProfilePage"));

// Startup Pages - redesigned separate pages
const PostStartupPage = lazy(() => import("./founders/PostStartupPage"));
const BrowseStartupsPage = lazy(() => import("./founders/BrowseStartupsPage"));
const StartupDetailPage = lazy(() => import("./founders/StartupDetailPage"));
// API and realtime imports
import * as inboxApi from "../utils/api/inboxApi";
import * as founderApi from "../utils/api/founderApi";
import { broadcastMessageUpdate } from "../utils/realtimeSubscriptions";
import { CallCoordinatorProvider } from "../contexts/CallCoordinatorContext";
import { toast } from "sonner";

// ⚡ LOADING FALLBACK - Minimal spinner for fast perceived performance
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-2">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const showCompensationDemo =
  import.meta.env.DEV ||
  import.meta.env.VITE_INCLUDE_COMPENSATION_DEMO === "true";

export default function DashboardHybrid({ user, onLogout, onUpdateUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const validPages = useMemo(
    () =>
      new Set([
        "dashboard",
        "startup-office",
        "inbox",
        "inbox:received",
        "inbox:sent",
        "analytics",
        "settings",
        "profile",
        "my-performance",
        "founder-chat",
        "talent-chat",
        "team-matching",
        "documents",
        "journey",
        "ideation",
        "formation",
        "team-building",
        "product-dev",
        "go-to-market",
        "operations",
        "post-startup",
        "browse-startups",
        "startup-detail",
        "talent-profile",
        "compensation-demo",
        "projects-workspace",
      ]),
    [],
  );

  const derivedNav = useMemo(
    () =>
      pathToDashboardState(
        location.pathname,
        location.search,
        user.role,
      ),
    [location.pathname, location.search, user.role],
  );

  const [selectedTalent, setSelectedTalent] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);

  const handleVirtualOfficeViewChange = useCallback(
    (view) => {
      navigate(
        dashboardStateToPath({
          currentPage: "startup-office",
          virtualOfficeView: view,
        }),
        { replace: true },
      );
    },
    [navigate],
  );

  const handleNavigate = (page, options = {}) => {
    if (page === "talent-profile" && (options?.talent || options?.talentId)) {
      if (options?.talent) {
        setSelectedTalent(options.talent);
      }
      const talentId = String(
        options.talentId ||
          options.talent?.userId?._id ||
          options.talent?.userId ||
          options.talent?._id ||
          options.talent?.id ||
          "",
      );
      navigate(
        dashboardStateToPath({
          currentPage: "talent-profile",
          ...(talentId ? { talentId } : {}),
        }),
      );
      return;
    }

    if (
      page === "startup-detail" &&
      (options?.startup || options?.startupId)
    ) {
      const startup = options?.startup || { id: options.startupId };
      setSelectedStartup(startup);
      const startupId = String(
        options.startupId || startup.id || startup._id || "",
      );
      navigate(
        dashboardStateToPath({
          currentPage: "startup-detail",
          ...(startupId ? { startupId } : {}),
        }),
      );
      return;
    }

    if (page === "profile") {
      navigate("/settings?editProfile=1");
      return;
    }

    const officeViewForPath =
      page === "startup-office"
        ? options?.officeView ??
          (derivedNav?.virtualOfficeView || "workspace")
        : undefined;

    const talentModeForPath =
      page === "dashboard" && user.role === "talent"
        ? options?.mode ??
          (derivedNav?.talentDashboardMode || "overview")
        : undefined;

    navigate(
      dashboardStateToPath({
        currentPage: page,
        virtualOfficeView: officeViewForPath,
        talentDashboardMode: talentModeForPath,
        initialProfileEditing:
          page === "settings"
            ? Boolean(options?.editProfile)
            : false,
        messageUserId: options?.messageUserId,
        taskId: options?.taskId,
        announcementId: options?.announcementId,
        winId: options?.winId,
        deliverableId: options?.deliverableId,
        officeTab: options?.officeTab,
        startupId: options?.startupId,
        talentId: options?.talentId,
        invitationId: options?.invitationId,
        projectSlug: options?.projectSlug,
        milestoneId: options?.milestoneId,
        projectTaskId: options?.projectTaskId,
      }),
    );
  };

  const clearEntityFromUrl = useCallback(
    (entityKeys) => {
      if (!derivedNav) return;
      const next = { ...derivedNav };
      for (const key of entityKeys) {
        delete next[key];
      }
      navigate(dashboardStateToPath(next), { replace: true });
    },
    [derivedNav, navigate],
  );

  if (!derivedNav || !validPages.has(derivedNav.currentPage)) {
    return <Navigate to="/home" replace />;
  }

  const {
    currentPage,
    virtualOfficeView = "workspace",
    talentDashboardMode = "overview",
    initialProfileEditing = false,
    messageUserId,
    taskId,
    announcementId,
    winId,
    startupId: urlStartupId,
    talentId: urlTalentId,
    projectSlug,
    milestoneId,
    projectTaskId,
  } = derivedNav;

  const renderPageContent = () => {
    // Only render pages outside Virtual Office when explicitly navigated to
    switch (currentPage) {
      case "dashboard":
        // Role-specific dashboards
        switch (user.role) {
          case "founder":
            return (
              <Suspense fallback={<PageLoadingFallback />}>
                <FounderDashboard
                  user={user}
                  onLogout={onLogout}
                  onUpdateUser={onUpdateUser}
                  onNavigate={handleNavigate}
                  onVirtualOfficeViewChange={handleVirtualOfficeViewChange}
                />
              </Suspense>
            );
          case "team-member":
          case "team":
            // Backward compatibility for old role value
            return (
              <Suspense fallback={<PageLoadingFallback />}>
                <TeamMemberDashboard user={user} onNavigate={handleNavigate} />
              </Suspense>
            );
          case "talent":
            return (
              <Suspense fallback={<PageLoadingFallback />}>
              <TalentDashboard
                user={user}
                onLogout={onLogout}
                onUpdateUser={onUpdateUser}
                onNavigate={handleNavigate}
                entryMode={talentDashboardMode}
              />
            </Suspense>
          );
          case "organization-admin":
            return (
              <Suspense fallback={<PageLoadingFallback />}>
                <OrganizationDashboard
                  user={user}
                  onLogout={onLogout}
                  onUpdateUser={onUpdateUser}
                />
              </Suspense>
            );
          default:
            return (
              <Suspense fallback={<PageLoadingFallback />}>
                <FounderDashboard
                  user={user}
                  onLogout={onLogout}
                  onUpdateUser={onUpdateUser}
                  onNavigate={handleNavigate}
                />
              </Suspense>
            );
        }
      case "settings":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingsPage
              user={user}
              onUpdateUser={onUpdateUser}
              initialProfileEditing={initialProfileEditing}
            />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingsPage
              user={user}
              onUpdateUser={onUpdateUser}
              initialProfileEditing={true}
            />
          </Suspense>
        );
      // Placeholder for now

      // Founder-specific pages (accessed from Virtual Office tabs/links)
      case "journey":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <FounderJourney
              user={user}
              onNavigate={(stage) => handleNavigate(stage)}
            />
          </Suspense>
        );
      case "ideation":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <IdeationValidation
              user={user}
              onBack={() => handleNavigate("startup-office")}
            />
          </Suspense>
        );
      case "formation":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <CompanyFormation
              user={user}
              onBack={() => handleNavigate("startup-office")}
            />
          </Suspense>
        );
      case "team-building":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeamBuilding
              user={user}
              onBack={() => handleNavigate("startup-office")}
              onNavigate={handleNavigate}
            />
          </Suspense>
        );
      case "product-dev":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <ProductDevelopment
              user={user}
              onBack={() => handleNavigate("startup-office")}
            />
          </Suspense>
        );
      case "go-to-market":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <GoToMarket
              user={user}
              onBack={() => handleNavigate("startup-office")}
            />
          </Suspense>
        );
      case "operations":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <Operations
              user={user}
              onBack={() => handleNavigate("startup-office")}
            />
          </Suspense>
        );

      // Documents and templates
      case "documents":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <DocumentsPage user={user} onNavigate={handleNavigate} />
          </Suspense>
        );
      case "pitch-deck":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <PitchDeck user={user} onBack={() => handleNavigate("documents")} />
          </Suspense>
        );

      // Team Matching
      case "team-matching":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeamMatching user={user} onNavigate={handleNavigate} />
          </Suspense>
        );

      // Talent Profile
      case "talent-profile":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <TalentProfilePage
              talent={
                selectedTalent ||
                (urlTalentId ? { id: urlTalentId, userId: urlTalentId } : null)
              }
              currentUser={user}
              onBack={() => {
                setSelectedTalent(null);
                handleNavigate("team-matching");
              }}
              onSendInvitation={async (message) => {
                if (!selectedTalent || !user) return;

                const founderId = String(user._id ?? user.id ?? "");
                const talentId = String(
                  selectedTalent.userId?._id ??
                  selectedTalent.userId ??
                  selectedTalent.user?._id ??
                  selectedTalent.user?.id ??
                  selectedTalent._id ??
                  selectedTalent.id ??
                  "",
                );
                if (!talentId) {
                  toast.error("Unable to identify this talent profile. Please refresh and try again.");
                  return;
                }

                let founderStartup = null;
                try {
                  const postsRes = await founderApi.getAllPosts();
                  if (postsRes?.success && Array.isArray(postsRes.posts)) {
                    founderStartup = postsRes.posts.find(
                      (post) => String(post.founderId ?? "") === founderId,
                    );
                  }
                } catch (error) {
                  console.error("Failed to verify founder startup before invitation:", error);
                }

                if (!founderStartup) {
                  toast.error("Please launch your startup before browsing talent or sending invites.");
                  handleNavigate("post-startup");
                  return;
                }

                const startupId =
                  String(founderStartup._id ?? founderStartup.id ?? "") ||
                  String(user.startupId ?? user.companyId ?? "");
                const startupTitle = String(
                  founderStartup.title ||
                    founderStartup.startupTitle ||
                    founderStartup.companyName ||
                    user.startupName ||
                    user.companyName ||
                    "",
                ).trim();

                if (!startupTitle) {
                  toast.error("Please complete your startup post title before sending invitations.");
                  handleNavigate("post-startup");
                  return;
                }

                const invitation = {
                  id: `inv_${Date.now()}_${founderId}`,
                  startupId,
                  startupTitle,
                  founderId,
                  founderName: user.name,
                  talentId,
                  talentName: selectedTalent.fullName || selectedTalent.name,
                  message,
                  role: selectedTalent.professionalTitle || "Team Member",
                  sentAt: new Date().toISOString(),
                  status: "pending",
                };

                try {
                  await inboxApi.sendInvitation(invitation);

                  // 🔥 REALTIME: Broadcast to talent that new chat connection is available
                  await broadcastMessageUpdate(null, "new_conversation", {
                    type: "invitation",
                    founderId,
                    founderName: user.name,
                    talentId,
                    startupId,
                    startupTitle,
                    message: `New invitation from ${user.name} at ${startupTitle}`,
                  });

                  toast.success(`Invitation sent to ${invitation.talentName}!`);
                } catch (err) {
                  console.error("Failed to send invitation:", err);
                  const msg = String(err?.message || "");
                  if (msg.toLowerCase().includes("already sent")) {
                    toast.error(msg);
                  } else {
                    toast.error("Failed to send invitation. Please try again.");
                  }
                }
              }}
            />
          </Suspense>
        );

      // Founder/Team Chat — full-page two-pane chat for founders and team members
      case "founder-chat":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <FounderChatPage
              user={user}
              onNavigate={handleNavigate}
              initialSelectedUserId={messageUserId || null}
            />
          </Suspense>
        );

      // Talent Chat — real-time chat with founders the talent expressed interest in
      case "talent-chat":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <TalentChatPage
              user={user}
              onNavigate={handleNavigate}
              initialSelectedUserId={messageUserId || null}
            />
          </Suspense>
        );

      // Startup Pages — redesigned separate pages
      case "post-startup":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <PostStartupPage
              user={user}
              onNavigate={handleNavigate}
            />
          </Suspense>
        );

      case "browse-startups":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <BrowseStartupsPage
              user={user}
              onNavigate={handleNavigate}
              onViewStartup={(startup) => {
                handleNavigate("startup-detail", { startup });
              }}
            />
          </Suspense>
        );

      case "startup-detail":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <StartupDetailPage
              user={user}
              startup={selectedStartup}
              startupId={
                selectedStartup?.id ||
                selectedStartup?._id ||
                urlStartupId ||
                ""
              }
              onNavigate={handleNavigate}
            />
          </Suspense>
        );

      case "projects-workspace":
        return null;

      // Inbox
      case "inbox":
      case "inbox:sent":
      case "inbox:received":
        const initialTab = currentPage.includes(":")
          ? currentPage.split(":")[1]
          : "received";
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <Inbox
              user={user}
              onBack={() => handleNavigate("dashboard")}
              initialTab={initialTab}
              onNavigate={handleNavigate}
            />
          </Suspense>
        );

      // Analytics
      case "analytics":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <AnalyticsDashboard
              founderId={user._id || user.id}
              founderName={user?.name || "Founder"}
            />
          </Suspense>
        );

      // Team Member - My Performance
      case "my-performance":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <MyPerformancePage user={user} />
          </Suspense>
        );

      case "compensation-demo":
        if (!showCompensationDemo) {
          return (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Compensation demo is disabled. Set VITE_INCLUDE_COMPENSATION_DEMO=true
              for staging, or use a development build.
            </div>
          );
        }
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <CompensationDemoPage user={user} />
          </Suspense>
        );

      // Default: Virtual Office (adaptive based on solo/team)
      case "startup-office":
      default:
        return (
          <AdaptiveVirtualOffice
            user={user}
            onNavigate={handleNavigate}
            onUpdateUser={onUpdateUser}
            view={virtualOfficeView}
            onViewChange={handleVirtualOfficeViewChange}
            taskToOpen={taskId || null}
            onTaskOpened={() => clearEntityFromUrl(["taskId", "officeTab"])}
            announcementToOpen={announcementId || null}
            onAnnouncementOpened={() =>
              clearEntityFromUrl(["announcementId", "officeTab"])
            }
            winToOpen={winId || null}
            onWinOpened={() => clearEntityFromUrl(["winId", "officeTab"])}
          />
        );
    }
  };
  return (
    <>
      {user.role === "organization-admin" ? (
        <>
          {renderPageContent()}
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminDebugIndicator />
          </Suspense>
        </>
      ) : (
        <CallCoordinatorProvider user={user}>
          <AppLayoutHybrid
            user={user}
            onLogout={onLogout}
            currentPage={currentPage}
            onPageChange={handleNavigate}
            virtualOfficeView={virtualOfficeView}
            onVirtualOfficeViewChange={handleVirtualOfficeViewChange}
            talentDashboardMode={talentDashboardMode}
            projectSlug={projectSlug}
            milestoneId={milestoneId}
            projectTaskId={projectTaskId}
          >
            {renderPageContent()}
          </AppLayoutHybrid>
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminDebugIndicator />
          </Suspense>
        </CallCoordinatorProvider>
      )}
    </>
  );
}
