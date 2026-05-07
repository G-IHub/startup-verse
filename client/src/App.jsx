import "./styles/globals.css";
import "./utils/earlyErrorSuppression";

import { useState, useEffect, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
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
  buildFounderProfile,
  buildTalentProfile,
  resolveDashboardIntent,
  resolveInitialView,
  upsertStoredRecord,
  getAccessToken,
} from "./app/session";
import {
  dashboardIntentToPath,
  DASHBOARD_ROUTE_PATHS,
} from "./app/dashboardPaths";
const DashboardHybrid = lazy(() => import("./components/DashboardHybrid"));
const ProfileCompletionModal = lazy(
  () => import("./components/ProfileCompletionModal"),
);
const TeamMemberOnboarding = lazy(() =>
  import("./components/TeamMemberOnboarding").then((m) => ({
    default: m.TeamMemberOnboarding,
  })),
);
const InvitationAcceptance = lazy(() =>
  import("./components/InvitationAcceptance"),
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

function BootstrapLegacyDashboardQuery() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;
    const params = new URLSearchParams(location.search || "");
    const legacy =
      params.has("dashboardPage") ||
      params.has("officeView") ||
      params.has("page") ||
      params.get("view") === "virtual-office" ||
      params.get("tab") === "inbox";
    if (!legacy || location.pathname !== "/") return;
    const intent = resolveDashboardIntent(location);
    const path = dashboardIntentToPath(intent, user.role);
    if (path) navigate(path, { replace: true });
  }, [user, isLoading, location.pathname, location.search, navigate]);

  return null;
}

function RequireDashboard() {
  const { user, isLoading } = useAuth();
  const [founderStartupOk, setFounderStartupOk] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.onboardingComplete) {
        setFounderStartupOk(null);
        return;
      }
      if (user.role !== "founder") {
        setFounderStartupOk(true);
        return;
      }
      const fid = String(user._id ?? user.id ?? "");
      if (!fid) {
        setFounderStartupOk(true);
        return;
      }
      try {
        const startup = await founderApi.getFounderStartupSafe(fid);
        if (!cancelled) setFounderStartupOk(Boolean(startup));
      } catch {
        if (!cancelled) setFounderStartupOk(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;

  if (user.role === "founder" && user.onboardingComplete) {
    if (founderStartupOk === null) return <LoadingSpinner />;
    if (!founderStartupOk) return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

function JoinMeetingRoute() {
  const { roomName } = useParams();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <JoinMeetingPage roomName={roomName || ""} />
    </Suspense>
  );
}

function UnknownPathFallback() {
  const { isLoading: authLoading, user: u } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (u && !u.onboardingComplete) nav("/onboarding", { replace: true });
    else if (u?.onboardingComplete) nav("/home", { replace: true });
    else nav("/", { replace: true });
  }, [authLoading, u, nav]);

  return <LoadingSpinner />;
}

// ---------------------------------------------------------------------------
// Main app content
// ---------------------------------------------------------------------------

function AppContent() {
  const { user, setUser, login, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState(APP_VIEWS.landing);
  const [invitationToken, setInvitationToken] = useState(null);
  /** null = resolving, 'cohort' | 'talent' | 'error' */
  const [invitationKind, setInvitationKind] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Defer non-critical initialization until after first paint
  useEffect(() => {
    const timer = window.setTimeout(() => {
      initializeNonCriticalFeatures().catch(() => {});
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  // Resolve initial marketing / shell view (URL-based dashboard uses separate routes).
  useEffect(() => {
    const initializeApp = async () => {
      if (authLoading) return;

      const pathname = location.pathname || "/";

      if (
        pathname.startsWith("/join/") ||
        pathname === "/mentor/login" ||
        DASHBOARD_ROUTE_PATHS.includes(pathname) ||
        pathname === "/onboarding"
      ) {
        setIsLoading(false);
        return;
      }

      const urlView = resolveInitialView(location);

      if (urlView === APP_VIEWS.admin) {
        if (user) {
          setCurrentView(APP_VIEWS.admin);
        } else {
          setCurrentView(APP_VIEWS.landing);
        }
        setIsLoading(false);
        return;
      }

      if (urlView === APP_VIEWS.invitation) {
        const token = new URLSearchParams(location.search || "").get(
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

      if (
        user &&
        (pathname === "/" || pathname === "") &&
        !resolveInitialView(location)
      ) {
        let nextPath = "/home";
        if (!user.onboardingComplete) {
          nextPath = "/onboarding";
        } else if (user.role === "founder") {
          const fid = String(user._id ?? user.id);
          if (fid) {
            const startup = await founderApi.getFounderStartupSafe(fid);
            if (!startup) nextPath = "/onboarding";
          }
        }
        navigate(nextPath, { replace: true });
        setIsLoading(false);
        return;
      }

      if (!user) {
        setCurrentView(APP_VIEWS.landing);
      }

      setIsLoading(false);
    };

    initializeApp();
  }, [user, authLoading, navigate, location]);

  useEffect(() => {
    if (currentView !== APP_VIEWS.invitation || !invitationToken) {
      setInvitationKind(null);
      return;
    }
    setInvitationKind(null);
    let cancelled = false;
    (async () => {
      try {
        const { API_BASE_URL } = await import("./config/apiBase.js");
        const r = await fetch(
          `${API_BASE_URL}/invitations/token/${encodeURIComponent(invitationToken)}`,
          { credentials: "include" },
        );
        const j = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok || !j?.success || !j?.data?.invitation) {
          setInvitationKind("error");
          return;
        }
        const kind = j.data.kind === "cohort" ? "cohort" : "talent";
        setInvitationKind(kind);
      } catch {
        if (!cancelled) setInvitationKind("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentView, invitationToken]);

  const clearInvitationQuery = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setInvitationToken(null);
    setInvitationKind(null);
  };

  const handleCohortInvitationResolved = async () => {
    clearInvitationQuery();
    try {
      const refreshed = await authApi.me();
      login({ user: refreshed });
    } catch {
      /* session unchanged */
    }
    navigate("/home", { replace: true });
  };

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
      });
      if (currentUser.onboardingComplete) {
        toast.success(`Welcome back, ${currentUser.name}!`);
        if (
          currentUser.role === "founder" &&
          (currentUser._id || currentUser.id)
        ) {
          const fid = String(currentUser._id ?? currentUser.id);
          founderApi.getFounderStartupSafe(fid).then((startup) => {
            navigate(startup ? "/home" : "/onboarding", { replace: true });
          });
        } else {
          navigate("/home", { replace: true });
        }
      } else {
        navigate("/onboarding", { replace: true });
      }
      return;
    }
    toast.error("Authentication failed. Please sign in or sign up with email.");
  };

  const handleInvitationAccepted = async (userData) => {
    const completedUser = { ...userData, onboardingComplete: true };
    login({
      user: completedUser,
    });

    if (userData.role === "team-member" || userData.role === "team") {
      teamMemberApi
        .saveTeamMemberProfile(completedUser.id, completedUser)
        .catch(() => {});
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    navigate("/home", { replace: true });
  };

  const handleLogout = () => {
    logout();
    setCurrentView(APP_VIEWS.landing);
    navigate("/", { replace: true });
  };

  const handleUpdateUser = async (updatedUser) => {
    if (!updatedUser) {
      logout();
      setCurrentView(APP_VIEWS.landing);
      navigate("/", { replace: true });
      return;
    }

    setUser(updatedUser);

    authApi
      .updateProfile(String(updatedUser._id ?? updatedUser.id), updatedUser)
      .catch((err) => {
        console.error("[handleUpdateUser] Profile sync failed:", err);
        toast.error(
          err?.message || "Could not save profile to the server. Please try again.",
        );
      });

    const { role } = updatedUser;

    if (role === "founder") {
      if (updatedUser.startupId) {
        founderApi
          .saveFounderProfile({
            userId: String(updatedUser._id ?? updatedUser.id),
            startupId: updatedUser.startupId,
            bio: updatedUser.bio || updatedUser.profile?.bio || "",
            background: "",
            links: {},
          })
          .catch(() => {});
      }
    } else if (role === "team-member") {
      teamMemberApi
        .saveTeamMemberProfile(updatedUser.id, updatedUser)
        .catch(() => {});
    } else if (role === "talent") {
      talentApi.saveTalentProfile(updatedUser.id, updatedUser).catch(() => {});
    }
  };

  const dashboardHybridElement =
    user ? (
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardHybrid
          user={user}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      </Suspense>
    ) : (
      <LoadingSpinner />
    );

  const marketingTree = (
    <>
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
          onPersistUser={handleUpdateUser}
          onComplete={async (_role, completedUser, accessToken) => {
            login({
              user: completedUser,
              accessToken: accessToken || getAccessToken(),
            });
            let nextPath = "/home";
            if (!completedUser.onboardingComplete) {
              nextPath = "/onboarding";
            } else if (completedUser.role === "founder") {
              const fid = String(completedUser._id ?? completedUser.id);
              if (fid) {
                const startup = await founderApi.getFounderStartupSafe(fid);
                if (!startup) nextPath = "/onboarding";
              }
            }
            navigate(nextPath, { replace: true });
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
              navigate(user ? "/home" : "/", { replace: true })
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

      {currentView === APP_VIEWS.invitation &&
        invitationToken &&
        invitationKind === null && <LoadingSpinner />}

      {currentView === APP_VIEWS.invitation &&
        invitationToken &&
        invitationKind === "error" && (
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <p className="text-lg font-medium">Invalid or expired invitation</p>
              <p className="text-muted-foreground text-sm">
                This link may have expired, already been used, or is incorrect.
              </p>
              <button
                type="button"
                className="text-primary underline"
                onClick={() => {
                  clearInvitationQuery();
                  setCurrentView(APP_VIEWS.landing);
                }}
              >
                Go to home
              </button>
            </div>
          </div>
        )}

      {currentView === APP_VIEWS.invitation &&
        invitationToken &&
        invitationKind === "cohort" && (
          <Suspense fallback={<LoadingSpinner />}>
            <InvitationAcceptance
              token={invitationToken}
              onAccept={handleInvitationAccepted}
              onCohortResolved={handleCohortInvitationResolved}
              onCancel={() => {
                clearInvitationQuery();
                if (user) navigate("/home", { replace: true });
                else setCurrentView(APP_VIEWS.landing);
              }}
            />
          </Suspense>
        )}

      {currentView === APP_VIEWS.invitation &&
        invitationToken &&
        invitationKind === "talent" && (
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
    </>
  );

  const onboardingRouteElement =
    user ? (
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileCompletionModal
          variant="page"
          role={user.role}
          user={user}
          onUpdateUser={handleUpdateUser}
          onComplete={() => navigate("/home", { replace: true })}
          onClose={async () => {
            if (user?.role === "founder") {
              const fid = String(user._id ?? user.id);
              if (fid) {
                const startup = await founderApi.getFounderStartupSafe(fid);
                if (!startup) {
                  toast.error(
                    "Complete startup profile (including startup name and type) before continuing.",
                  );
                  return;
                }
              }
            }
            navigate("/home", { replace: true });
          }}
        />
      </Suspense>
    ) : (
      <Navigate to="/" replace />
    );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <BootstrapLegacyDashboardQuery />
      <Routes>
        <Route path="/join/:roomName" element={<JoinMeetingRoute />} />
        <Route
          path="/mentor/login"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <MentorLogin />
            </Suspense>
          }
        />
        <Route path="/onboarding" element={onboardingRouteElement} />
        <Route element={<RequireDashboard />}>
          {DASHBOARD_ROUTE_PATHS.map((p) => (
            <Route key={p} path={p} element={dashboardHybridElement} />
          ))}
        </Route>
        <Route path="/" element={marketingTree} />
        <Route path="*" element={<UnknownPathFallback />} />
      </Routes>
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
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
