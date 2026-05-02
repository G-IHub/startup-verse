/**
 * DashboardHybrid - Main dashboard router component
 * Handles routing between different views based on user role
 */
import React, { useState, lazy, Suspense, useCallback } from "react";
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
  // For founders and talent, default to 'dashboard' (homepage)
  // For team members, also default to 'dashboard' (team member home)
  const getDefaultPage = () => {
    return "dashboard"; // All roles start at their respective dashboard
  };
  const [currentPage, setCurrentPage] = useState(getDefaultPage());
  const [virtualOfficeView, setVirtualOfficeView] = useState("workspace");
  const [taskToOpen, setTaskToOpen] = useState(null);
  const [announcementToOpen, setAnnouncementToOpen] = useState(null);
  const [messageUserToOpen, setMessageUserToOpen] = useState(null);
  const [winToOpen, setWinToOpen] = useState(null);
  const [talentDashboardMode, setTalentDashboardMode] = useState("overview");
  const [initialProfileEditing, setInitialProfileEditing] = useState(false);

  const handleVirtualOfficeViewChange = useCallback(
    (view) => {
      setVirtualOfficeView(view);
    },
    [],
  );

  // Wrapper for setCurrentPage with logging
  const handleNavigate = (page, options) => {
    console.log(
      "🧭 [DashboardHybrid] handleNavigate called with:",
      page,
      options,
    );
    console.log("🧭 [DashboardHybrid] Current page:", currentPage);

    // Handle task opening from notifications
    if (options?.taskId) {
      console.log("📋 [DashboardHybrid] Task ID received:", options.taskId);
      setTaskToOpen(options.taskId);
      // Navigate to startup-office (virtual office) with workspace view
      setCurrentPage("startup-office");
      setVirtualOfficeView("workspace");
    }
    // Handle announcement opening from notifications
    else if (options?.announcementId) {
      console.log(
        "📢 [DashboardHybrid] Announcement ID received:",
        options.announcementId,
      );
      setAnnouncementToOpen(options.announcementId);
      // Navigate to startup-office (virtual office) with workspace view
      setCurrentPage("startup-office");
      setVirtualOfficeView("workspace");
    } else if (options?.openTeamHub || options?.messageUserId) {
      if (options?.messageUserId) {
        setMessageUserToOpen(options.messageUserId);
      }
      if (options?.winId) {
        setWinToOpen(options.winId);
      }
      setCurrentPage("startup-office");
      setVirtualOfficeView("workspace");
    } else {
      if (page === "dashboard" && user.role === "talent") {
        setTalentDashboardMode(options?.mode || "overview");
      }
      setInitialProfileEditing(page === "settings" && options?.editProfile === true);
      setCurrentPage(page);
    }
    console.log("✅ [DashboardHybrid] Page navigation triggered to:", page);
  };

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
                  onVirtualOfficeViewChange={setVirtualOfficeView}
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
        // Redirect to settings (profile is now inside settings)
        handleNavigate("settings", { editProfile: true });
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

      // Founder/Team Chat — full-page two-pane chat for founders and team members
      case "founder-chat":
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <FounderChatPage
              user={user}
              onNavigate={handleNavigate}
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
            />
          </Suspense>
        );

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
            taskToOpen={taskToOpen}
            onTaskOpened={() => setTaskToOpen(null)}
            announcementToOpen={announcementToOpen}
            onAnnouncementOpened={() => setAnnouncementToOpen(null)}
            messageUserToOpen={messageUserToOpen}
            onMessageUserOpened={() => setMessageUserToOpen(null)}
            winToOpen={winToOpen}
            onWinOpened={() => setWinToOpen(null)}
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
        <>
          <AppLayoutHybrid
            user={user}
            onLogout={onLogout}
            currentPage={currentPage}
            onPageChange={handleNavigate}
            virtualOfficeView={virtualOfficeView}
            onVirtualOfficeViewChange={handleVirtualOfficeViewChange}
            talentDashboardMode={talentDashboardMode}
          >
            {renderPageContent()}
          </AppLayoutHybrid>
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminDebugIndicator />
          </Suspense>
        </>
      )}
    </>
  );
}
