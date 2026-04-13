import "./styles/globals.css";
import "./utils/earlyErrorSuppression";

import { useState, useEffect, lazy, Suspense } from "react";
import LoginPage from "./components/LoginPage";
import ChooseYourPathPage from "./components/ChooseYourPathPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import * as founderApi from "./utils/api/founderApi";
import * as teamMemberApi from "./utils/api/teamMemberApi";
import * as talentApi from "./utils/api/talentApi";
import { authApi } from "./api/authApi";
import { initializeErrorSuppression } from "./utils/errorSuppression";
import {
  APP_VIEWS,
  STORAGE_KEYS,
  buildFounderProfile,
  buildTalentProfile,
  ensureSessionMigration,
  getAccessToken,
  loadCurrentUser,
  resolveInitialView,
  safeParseJson,
  upsertStoredRecord,
} from "./app/session";

ensureSessionMigration();

// Lazy-loaded route components
const DashboardHybrid = lazy(() => import("./components/DashboardHybrid"));
const ProfileCompletionModal = lazy(
  () => import("./components/ProfileCompletionModal"),
);
const TeamMemberOnboarding = lazy(() =>
  import("./components/TeamMemberOnboarding").then((m) => ({
    default: m.TeamMemberOnboarding,
  })),
);
const AdminDashboardRealTime = lazy(
  () => import("./components/admin/AdminDashboardRealTime"),
);
const JoinMeetingPage = lazy(
  () => import("./components/calendar/JoinMeetingPage"),
);
const MentorLogin = lazy(() => import("./pages/MentorLogin"));
const LandingPage = lazy(() => import("./LandingPage"));
const WaitlistLandingPage = lazy(
  () => import("./components/WaitlistLandingPage"),
);
const TalentWaitlistPage = lazy(
  () => import("./components/TalentWaitlistPage"),
);
const ChallengeLandingPage = lazy(
  () => import("./components/ChallengeLandingPage"),
);
const DualPathHomePage = lazy(() =>
  import("./components/DualPathHomePage").then((m) => ({
    default: m.DualPathHomePage,
  })),
);
const AspiringFounderLandingPage = lazy(() =>
  import("./components/AspiringFounderLandingPage").then((m) => ({
    default: m.AspiringFounderLandingPage,
  })),
);
const AcceleratorLandingPage = lazy(() =>
  import("./components/AcceleratorLandingPage").then((m) => ({
    default: m.AcceleratorLandingPage,
  })),
);
const NotificationCronTrigger = lazy(
  () => import("./components/NotificationCronTrigger"),
);
const EventReminderCron = lazy(() => import("./components/EventReminderCron"));

// Admin tools (development only)
// Deferred module references (populated after first paint)
let refreshCurrentUser;
let offlineStorage;
let registerServiceWorker;

async function initializeNonCriticalFeatures() {
  initializeErrorSuppression();

  const [
    { refreshCurrentUser: refresh },
    { offlineStorage: storage },
    { registerServiceWorker: registerSW },
  ] = await Promise.all([
    import("./utils/api/userApi"),
    import("./utils/offlineStorage"),
    import("./utils/serviceWorkerManager"),
  ]);

  refreshCurrentUser = refresh;
  offlineStorage = storage;
  registerServiceWorker = registerSW;

  registerServiceWorker?.().catch(() => {});
  offlineStorage?.init?.().catch(() => {});
}

// ---------------------------------------------------------------------------
// Loading indicator
// ---------------------------------------------------------------------------

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main app content
// ---------------------------------------------------------------------------

function AppContent() {
  const { user, setUser, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState(APP_VIEWS.landing);
  const [invitationToken, setInvitationToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Defer non-critical initialization until after first paint
  useEffect(() => {
    const timer = window.setTimeout(() => {
      initializeNonCriticalFeatures().catch(() => {});
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  // Resolve initial view from URL or persisted session
  useEffect(() => {
    const initializeApp = async () => {
      const urlView = resolveInitialView();

      if (urlView === APP_VIEWS.admin) {
        const savedUser = loadCurrentUser();
        if (savedUser) {
          login({ user: savedUser, accessToken: getAccessToken() });
          setCurrentView(APP_VIEWS.admin);
        } else {
          setCurrentView(APP_VIEWS.landing);
        }
        setIsLoading(false);
        return;
      }

      if (urlView === APP_VIEWS.invitation) {
        const token = new URLSearchParams(window.location.search).get(
          "invitation",
        );
        setInvitationToken(token);
        setCurrentView(APP_VIEWS.invitation);
        setIsLoading(false);
        return;
      }

      if (urlView) {
        setCurrentView(urlView);
        setIsLoading(false);
        return;
      }

      // Run one-time auth migration (legacy accounts)
      if (
        import.meta.env.VITE_ENABLE_AUTH_MIGRATION === "true" &&
        !localStorage.getItem(STORAGE_KEYS.authMigrationCompleted)
      ) {
        import("./utils/backendHealthCheck").then(
          ({ runAuthMappingMigration }) => {
            runAuthMappingMigration(true)
              .then((result) => {
                if (result?.success) {
                  localStorage.setItem(
                    STORAGE_KEYS.authMigrationCompleted,
                    "true",
                  );
                }
              })
              .catch(() => {});
          },
        );
      }

      // Restore existing session
      const savedUser = loadCurrentUser();
      if (savedUser) {
        login({ user: savedUser, accessToken: getAccessToken() });

        // Non-blocking backend refresh
        if (refreshCurrentUser) {
          refreshCurrentUser(savedUser.id)
            .then((freshUser) => {
              if (!freshUser) return;
              setUser(freshUser);
              if (freshUser.role !== savedUser.role) {
                toast.success(
                  `Your role has been updated to ${freshUser.role}!`,
                );
              }
            })
            .catch(() => {});
        }

        setCurrentView(
          savedUser.onboardingComplete
            ? APP_VIEWS.dashboard
            : APP_VIEWS.profileSetup,
        );
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Guard: sync view with onboarding state
  useEffect(() => {
    if (!user) return;
    if (!user.onboardingComplete && currentView === APP_VIEWS.dashboard) {
      setCurrentView(APP_VIEWS.profileSetup);
    }
    if (user.onboardingComplete && currentView === APP_VIEWS.profileSetup) {
      setCurrentView(APP_VIEWS.dashboard);
    }
  }, [user, currentView]);

  // ---------------------------------------------------------------------------
  // Auth handlers
  // ---------------------------------------------------------------------------

  const handleRoleSelect = async (role, signupData) => {
    if (!signupData?.email && signupData?.method === "email") {
      toast.error("Authentication error. Please try again.");
      return;
    }

    // Backend auth path
    if (signupData?.backendUser) {
      const currentUser = signupData.backendUser;
      login({
        user: currentUser,
        accessToken: signupData.backendToken || getAccessToken(),
      });
      if (currentUser.onboardingComplete) {
        toast.success(`Welcome back, ${currentUser.name}!`);
        setCurrentView(APP_VIEWS.dashboard);
      } else {
        setCurrentView(APP_VIEWS.profileSetup);
      }
      return;
    }
    toast.error("Authentication failed. Please sign in or sign up with email.");
  };

  const handleInvitationAccepted = async (userData) => {
    const completedUser = { ...userData, onboardingComplete: true };
    login({
      user: completedUser,
      accessToken: userData?.backendToken || getAccessToken(),
    });
    upsertStoredRecord(STORAGE_KEYS.registeredUsers, completedUser);
    upsertStoredRecord(STORAGE_KEYS.teamMembers, completedUser);

    if (userData.role === "team-member" || userData.role === "team") {
      teamMemberApi
        .saveTeamMemberProfile(completedUser.id, completedUser)
        .catch(() => {});
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    setCurrentView(APP_VIEWS.dashboard);
  };

  const handleLogout = () => {
    logout();
    setCurrentView(APP_VIEWS.landing);
  };

  const handleUpdateUser = async (updatedUser) => {
    if (!updatedUser) {
      logout();
      setCurrentView(APP_VIEWS.landing);
      return;
    }

    setUser(updatedUser);
    upsertStoredRecord(STORAGE_KEYS.registeredUsers, updatedUser);

    authApi.updateProfile(updatedUser.id, updatedUser).catch(() => {});

    const { role } = updatedUser;

    if (role === "founder") {
      upsertStoredRecord(
        STORAGE_KEYS.founderProfiles,
        buildFounderProfile(updatedUser),
      );
      founderApi
        .saveFounderProfile(updatedUser.id, updatedUser)
        .catch(() => {});
    } else if (role === "team-member") {
      teamMemberApi
        .saveTeamMemberProfile(updatedUser.id, updatedUser)
        .catch(() => {});
    } else if (role === "talent") {
      upsertStoredRecord(
        STORAGE_KEYS.talentProfiles,
        buildTalentProfile(updatedUser),
      );
      talentApi.saveTalentProfile(updatedUser.id, updatedUser).catch(() => {});
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      {currentView === APP_VIEWS.home && (
        <Suspense fallback={<LoadingSpinner />}>
          <DualPathHomePage
            onAspiringPath={() => setCurrentView(APP_VIEWS.aspiring)}
            onExecutionPath={() => setCurrentView(APP_VIEWS.challenge)}
            onAcceleratorPath={() => setCurrentView(APP_VIEWS.accelerator)}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.aspiring && (
        <Suspense fallback={<LoadingSpinner />}>
          <AspiringFounderLandingPage
            onStartJourney={() => setCurrentView(APP_VIEWS.choosePath)}
            onBack={() => setCurrentView(APP_VIEWS.home)}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.accelerator && (
        <Suspense fallback={<LoadingSpinner />}>
          <AcceleratorLandingPage
            onGetStarted={() => setCurrentView(APP_VIEWS.choosePath)}
            onBack={() => setCurrentView(APP_VIEWS.home)}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.landing && (
        <LoginPage
          onRoleSelect={handleRoleSelect}
          onNavigateToSignup={() => setCurrentView(APP_VIEWS.choosePath)}
        />
      )}

      {currentView === APP_VIEWS.choosePath && (
        <ChooseYourPathPage
          onBack={() => setCurrentView(APP_VIEWS.landing)}
          onComplete={(_role, completedUser) => {
            setUser(completedUser);
            setCurrentView(APP_VIEWS.dashboard);
          }}
        />
      )}

      {currentView === APP_VIEWS.marketing && (
        <Suspense fallback={<LoadingSpinner />}>
          <LandingPage />
        </Suspense>
      )}

      {currentView === APP_VIEWS.waitlist && (
        <Suspense fallback={<LoadingSpinner />}>
          <WaitlistLandingPage />
        </Suspense>
      )}

      {currentView === APP_VIEWS.talentWaitlist && (
        <Suspense fallback={<LoadingSpinner />}>
          <TalentWaitlistPage
            onBack={() =>
              setCurrentView(user ? APP_VIEWS.dashboard : APP_VIEWS.landing)
            }
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.challenge && (
        <Suspense fallback={<LoadingSpinner />}>
          <ChallengeLandingPage
            onJoinChallenge={() => setCurrentView(APP_VIEWS.choosePath)}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.invitation && invitationToken && (
        <Suspense fallback={<LoadingSpinner />}>
          <TeamMemberOnboarding
            invitationToken={invitationToken}
            onComplete={handleInvitationAccepted}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.invitation && !invitationToken && (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </div>
        </div>
      )}

      {currentView === APP_VIEWS.dashboard && user && (
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardHybrid
            user={user}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.profileSetup && user && (
        <Suspense fallback={<LoadingSpinner />}>
          <ProfileCompletionModal
            role={user.role}
            user={user}
            onUpdateUser={handleUpdateUser}
            onComplete={() => setCurrentView(APP_VIEWS.dashboard)}
            onClose={() => setCurrentView(APP_VIEWS.dashboard)}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.joinMeeting && (
        <Suspense fallback={<LoadingSpinner />}>
          <JoinMeetingPage
            roomName={window.location.pathname.split("/join/")[1] || ""}
          />
        </Suspense>
      )}

      {currentView === APP_VIEWS.admin && user && (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminDashboardRealTime />
        </Suspense>
      )}

      {currentView === APP_VIEWS.mentorLogin && (
        <Suspense fallback={<LoadingSpinner />}>
          <MentorLogin />
        </Suspense>
      )}

      <Toaster />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={null}>
            <NotificationCronTrigger />
          </Suspense>
          <Suspense fallback={null}>
            <EventReminderCron />
          </Suspense>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
