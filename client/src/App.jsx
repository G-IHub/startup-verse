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
import { buildFounderProfilePayload } from "./domains/founder/founderProfilePayload";
import * as teamMemberApi from "./utils/api/teamMemberApi";
import * as talentApi from "./utils/api/talentApi";
import { getUserOrganizations } from "./utils/api/organizationApi";
import { authApi } from "./api/authApi";
import { initializeErrorSuppression } from "./utils/errorSuppression";
import {
  APP_VIEWS,
  buildFounderProfile,
  buildTalentProfile,
  resolveDashboardIntent,
  resolveInitialView,
  getAccessToken,
} from "./app/session";
import {
  dashboardIntentToPath,
  DASHBOARD_ROUTE_PATHS,
} from "./app/dashboardPaths";
const DashboardHybrid = lazy(() => import("./components/DashboardHybrid"));
const ProfileCompletionForm = lazy(
  () => import("./components/ProfileCompletionForm"),
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

function useOnboardingGateStatus(user) {
  const [founderStartupOk, setFounderStartupOk] = useState(null);
  const [organizationReady, setOrganizationReady] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.onboardingComplete) {
        setFounderStartupOk(null);
        setOrganizationReady(null);
        return;
      }
      if (user.role === "organization-admin") {
        setFounderStartupOk(true);
        const userId = String(user._id ?? user.id ?? "");
        if (!userId) {
          if (!cancelled) setOrganizationReady(false);
          return;
        }
        try {
          const organizations = await getUserOrganizations(userId);
          if (!cancelled) setOrganizationReady(organizations.length > 0);
        } catch {
          if (!cancelled) setOrganizationReady(false);
        }
        return;
      }
      setOrganizationReady(true);
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

  return { founderStartupOk, organizationReady };
}

function RequireDashboard() {
  const { user, isLoading } = useAuth();
  const { founderStartupOk, organizationReady } = useOnboardingGateStatus(user);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;

  if (user.role === "founder" && user.onboardingComplete) {
    if (founderStartupOk === null) return <LoadingSpinner />;
    if (!founderStartupOk) return <Navigate to="/onboarding" replace />;
  }

  if (user.role === "organization-admin" && user.onboardingComplete) {
    if (organizationReady === null) return <LoadingSpinner />;
    if (!organizationReady) return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/** Keep /onboarding available only until profile setup is finished. */
function RequireOnboarding() {
  const { user, isLoading } = useAuth();
  const { founderStartupOk, organizationReady } = useOnboardingGateStatus(user);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;

  if (user.onboardingComplete) {
    if (user.role === "founder") {
      if (founderStartupOk === null) return <LoadingSpinner />;
      if (founderStartupOk) return <Navigate to="/home" replace />;
    } else if (user.role === "organization-admin") {
      if (organizationReady === null) return <LoadingSpinner />;
      if (organizationReady) return <Navigate to="/home" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
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

  const handleUpdateUser = async (updatedUser, options = {}) => {
    if (!updatedUser) {
      logout();
      setCurrentView(APP_VIEWS.landing);
      navigate("/", { replace: true });
      return;
    }

    setUser(updatedUser);

    // Avatar upload already persisted on the server — only refresh local session.
    if (options.skipRemoteSync) {
      return;
    }

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
          .saveFounderProfile(buildFounderProfilePayload(updatedUser))
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

  const onboardingRouteElement = (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileCompletionForm
        variant="page"
        showBack={false}
        role={user?.role}
        user={user}
        onUpdateUser={handleUpdateUser}
        onComplete={() => navigate("/home", { replace: true })}
      />
    </Suspense>
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
        <Route element={<RequireOnboarding />}>
          <Route path="/onboarding" element={onboardingRouteElement} />
        </Route>
        <Route element={<RequireDashboard />}>
          {DASHBOARD_ROUTE_PATHS.map((p) => (
            <Route key={p} path={p} element={dashboardHybridElement} />
          ))}
        </Route>
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="/" element={marketingTree} />
        <Route path="*" element={<UnknownPathFallback />} />
      </Routes>
      <Toaster />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy page — public, no auth required
// ---------------------------------------------------------------------------

function PolicyPage() {
  const s = { p: { marginBottom: 14, color: "#374151" }, h2: { fontSize: 17, fontWeight: 600, margin: "32px 0 10px" }, ul: { paddingLeft: 20, marginBottom: 14, color: "#374151" }, li: { marginBottom: 6 } };
  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize: 15, lineHeight: 1.7, color: "#1a1a1a", background: "#fff", minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 40 }}>StartupVerse · Last updated: September 2026</p>
        <p style={s.p}>StartupVerse ("we", "our", or "us") operates startupverse.space — an AI-powered execution platform built for founders. We provide tools including an AI staff layer, virtual office, execution engine, investor view, startup profile management, and integrations with third-party services. This Privacy Policy explains what data we collect, how we use it, and your rights over it.</p>
        <h2 style={s.h2}>1. Information We Collect</h2>
        <p style={s.p}><strong>Account information:</strong> When you register, we collect your name, email address, role, and startup details you provide during onboarding.</p>
        <p style={s.p}><strong>Startup and business data:</strong> Information you enter about your startup — product description, target market, milestones, financials, team members — used to power AI staff features and your Startup Profile.</p>
        <p style={s.p}><strong>Usage data:</strong> Actions you take in the platform (tasks created, AI conversations, execution events) used to improve your experience and support the AI agents working on your behalf.</p>
        <p style={s.p}><strong>Third-party integration data:</strong> When you connect external accounts (LinkedIn, Gmail, WhatsApp, GitHub, Calendly, etc.), we collect only what is needed to provide that integration:</p>
        <ul style={s.ul}>
          <li style={s.li}>OAuth access tokens and identifiers to perform the actions you authorize</li>
          <li style={s.li}>Basic profile info (name, profile picture) returned by the connected platform</li>
          <li style={s.li}>We do not collect your passwords or payment details for any connected platform</li>
        </ul>
        <h2 style={s.h2}>2. How We Use Your Information</h2>
        <ul style={s.ul}>
          <li style={s.li}><strong>To operate the platform:</strong> Running your AI staff (AI PM, AI Developer, AI Sales, AI Marketing, AI Finance, AI Legal), Execution Engine, Virtual Office, and all other core features</li>
          <li style={s.li}><strong>To power integrations you enable:</strong> For example, publishing a LinkedIn post, sending a Gmail sequence, sending a WhatsApp message, creating a GitHub PR — only when you initiate the action</li>
          <li style={s.li}><strong>To personalize AI outputs:</strong> Your startup data and past interactions help AI agents give more relevant, context-aware responses</li>
          <li style={s.li}><strong>To communicate with you:</strong> Account notifications, reminders, and product updates</li>
          <li style={s.li}>We do not use your data for advertising, sell it to data brokers, or profile you for third parties</li>
        </ul>
        <h2 style={s.h2}>3. Third-Party Integrations</h2>
        <p style={s.p}>StartupVerse connects to the following categories of third-party services on your behalf, only when you choose to enable them:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Social & content:</strong> LinkedIn (post publishing), Instagram, Facebook — AI drafts content, you control what gets sent</li>
          <li style={s.li}><strong>Communication:</strong> Gmail (outreach emails), WhatsApp Business (outreach messages), Calendly (booking links and events)</li>
          <li style={s.li}><strong>Development:</strong> GitHub (pull requests, code repos), Vercel (deploys)</li>
          <li style={s.li}><strong>Productivity:</strong> Google Calendar, DocuSign</li>
          <li style={s.li}><strong>Finance:</strong> Stripe, bank connections (read-only), QuickBooks</li>
        </ul>
        <p style={s.p}>Each integration uses only the minimum permissions required. Their own privacy policies also apply — we encourage you to review them for any connected platform.</p>
        <h2 style={s.h2}>4. Data Storage and Security</h2>
        <p style={s.p}>Your data is stored securely in our database, accessible only to your account. OAuth tokens and credentials are stored with access controls and are never exposed in client-side code or logs. We use industry-standard practices to protect data at rest and in transit.</p>
        <h2 style={s.h2}>5. Data Sharing</h2>
        <p style={s.p}>We do not sell or rent your personal data. We share data only in these limited cases:</p>
        <ul style={s.ul}>
          <li style={s.li}>With the third-party platforms you have connected, to perform the actions you request</li>
          <li style={s.li}>With infrastructure providers (hosting, database, storage) who process data on our behalf under confidentiality agreements</li>
          <li style={s.li}>Where required by law or to protect the rights and safety of users</li>
        </ul>
        <h2 style={s.h2}>6. Your Rights and Controls</h2>
        <ul style={s.ul}>
          <li style={s.li}><strong>Disconnect integrations:</strong> Go to StartupVerse → Integrations → select any integration → Disconnect. Tokens are removed immediately.</li>
          <li style={s.li}><strong>Revoke via the platform:</strong> You can also revoke access directly in the connected platform's own settings</li>
          <li style={s.li}><strong>Access your data:</strong> Contact us to request a copy of the data we hold about you</li>
          <li style={s.li}><strong>Delete your account:</strong> Contact us to permanently delete your account and associated data</li>
        </ul>
        <h2 style={s.h2}>7. Cookies and Local Storage</h2>
        <p style={s.p}>We use cookies and browser local storage to maintain your session and remember your preferences (e.g. selected view, theme). We do not use tracking or advertising cookies.</p>
        <h2 style={s.h2}>8. Children's Privacy</h2>
        <p style={s.p}>StartupVerse is not directed at children under 16. We do not knowingly collect data from anyone under 16. If you believe we have done so in error, contact us and we will delete it promptly.</p>
        <h2 style={s.h2}>9. Changes to This Policy</h2>
        <p style={s.p}>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of StartupVerse after changes are posted constitutes your acceptance of the revised policy.</p>
        <h2 style={s.h2}>10. Contact Us</h2>
        <p style={s.p}>Questions, data requests, or deletion requests: <a href="mailto:genomachub@gmail.com" style={{ color: "#4f46e5" }}>genomachub@gmail.com</a></p>
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#9ca3af" }}>© 2026 StartupVerse. All rights reserved.</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function AppProvidersInner() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvidersInner />
    </AuthProvider>
  );
}
