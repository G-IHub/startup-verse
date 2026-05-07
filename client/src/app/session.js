export const APP_VIEWS = Object.freeze({
  accelerator: "accelerator",
  admin: "admin",
  aspiring: "aspiring",
  challenge: "challenge",
  choosePath: "choose-path",
  dashboard: "dashboard",
  home: "home",
  invitation: "invitation",
  landing: "landing",
  marketing: "marketing",
  mentorLogin: "mentor-login",
  profileSetup: "profile-setup",
  joinMeeting: "join-meeting",
  talentWaitlist: "talent-waitlist",
  waitlist: "waitlist",
});

/** Canonical localStorage keys; read/write session via loadAuthSession / persistAuthSession. */
export const STORAGE_KEYS = Object.freeze({
  authMigrationCompleted: "auth_migration_v1_completed",
  currentUser: "startupverse_user",
  legacyToken: "startupverse_token",
  founderProfiles: "startupverse_founder_profiles",
  registeredUsers: "startupverse_registered_users",
  talentProfiles: "startupverse_talent_profiles",
  teamMembers: "startupverse_users",
  sessionV2: "sv:session:v2",
});

export function safeParseJson(raw, fallback) {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function resolveInitialView(location = window.location) {
  const { pathname, search } = location;
  const params = new URLSearchParams(search);

  if (pathname.startsWith("/mentor/login")) return APP_VIEWS.mentorLogin;
  if (pathname.startsWith("/join/")) return APP_VIEWS.joinMeeting;
  if (params.get("aspiring") === "true") return APP_VIEWS.aspiring;
  if (params.get("accelerator") === "true") return APP_VIEWS.accelerator;
  if (params.get("execution") === "true") return APP_VIEWS.challenge;
  if (params.get("challenge") === "true") return APP_VIEWS.challenge;
  if (params.get("marketing") === "true") return APP_VIEWS.marketing;
  if (params.get("waitlist") === "true") return APP_VIEWS.waitlist;
  if (params.get("talent") === "true") return APP_VIEWS.talentWaitlist;
  if (params.get("invitation")) return APP_VIEWS.invitation;
  if (params.get("admin") === "true") return APP_VIEWS.admin;

  return null;
}

const DASHBOARD_PAGE_SET = new Set([
  "dashboard",
  "startup-office",
  "inbox",
  "inbox:received",
  "inbox:sent",
  "analytics",
  "settings",
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
]);

function normalizeInboxPage(tab) {
  const normalized = String(tab || "").toLowerCase();
  if (normalized === "sent") return "inbox:sent";
  if (normalized === "received") return "inbox:received";
  return "inbox";
}

/**
 * Parses legacy `?dashboardPage=`, `?officeView=`, `?view=virtual-office`, etc.
 * For SPA navigation to path-based URLs (`/inbox`, `/office`, …), use
 * `dashboardIntentToPath` from `app/dashboardPaths.js` (see `BootstrapLegacyDashboardQuery` in `App.jsx`).
 */
export function resolveDashboardIntent(location = window.location) {
  const params = new URLSearchParams(location.search || "");
  const dashboardPage = params.get("dashboardPage") || params.get("page");
  const officeView = params.get("officeView");

  // Preferred format: ?dashboardPage=inbox or ?dashboardPage=startup-office
  if (dashboardPage) {
    const normalizedPage = String(dashboardPage).toLowerCase();
    if (normalizedPage === "inbox") {
      return { page: normalizeInboxPage(params.get("inboxTab")) };
    }
    if (DASHBOARD_PAGE_SET.has(normalizedPage)) {
      return {
        page: normalizedPage,
        ...(normalizedPage === "startup-office" && officeView
          ? { virtualOfficeView: officeView }
          : {}),
      };
    }
  }

  // Backward compatibility: ?view=virtual-office&tab=inbox
  const legacyView = params.get("view");
  const legacyTab = params.get("tab");
  if (legacyView === "virtual-office" && legacyTab === "inbox") {
    return { page: "inbox" };
  }
  if (legacyView === "virtual-office") {
    return { page: "startup-office" };
  }
  if (legacyTab === "inbox") {
    return { page: "inbox" };
  }

  return null;
}

export function readStoredList(key) {
  return safeParseJson(localStorage.getItem(key), []);
}

export function writeStoredList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function persistCurrentUser(user) {
  const current = loadAuthSession();
  persistAuthSession({
    ...current,
    user,
  });
}

export function clearCurrentUser() {
  const current = loadAuthSession();
  persistAuthSession({
    ...current,
    user: null,
  });
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

export function loadCurrentUser() {
  const session = loadAuthSession();
  return session?.user || safeParseJson(localStorage.getItem(STORAGE_KEYS.currentUser), null);
}

export function loadAuthSession() {
  return safeParseJson(localStorage.getItem(STORAGE_KEYS.sessionV2), null);
}

export function persistAuthSession(session) {
  localStorage.setItem(STORAGE_KEYS.sessionV2, JSON.stringify(session));
  if (session?.user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(session.user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  if (session?.accessToken) {
    localStorage.setItem(STORAGE_KEYS.legacyToken, session.accessToken);
  } else {
    localStorage.removeItem(STORAGE_KEYS.legacyToken);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.sessionV2);
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem(STORAGE_KEYS.legacyToken);
}

export function getAccessToken() {
  const session = loadAuthSession();
  return session?.accessToken || localStorage.getItem(STORAGE_KEYS.legacyToken) || "";
}

export function setAccessToken(accessToken) {
  const session = loadAuthSession() || { version: 2, user: null };
  persistAuthSession({
    ...session,
    accessToken: accessToken || "",
  });
}

export function setSessionUser(user) {
  const session = loadAuthSession() || { version: 2, accessToken: "" };
  persistAuthSession({
    ...session,
    user: user || null,
  });
}

export function ensureSessionMigration() {
  const existing = loadAuthSession();
  if (existing) {
    return existing;
  }

  const legacyUser = safeParseJson(localStorage.getItem(STORAGE_KEYS.currentUser), null);
  const legacyToken = localStorage.getItem(STORAGE_KEYS.legacyToken) || "";
  const migrated = {
    version: 2,
    user: legacyUser,
    accessToken: legacyToken,
    migratedFromLegacy: true,
    updatedAt: new Date().toISOString(),
  };
  persistAuthSession(migrated);
  return migrated;
}

export function upsertStoredRecord(key, record) {
  const list = readStoredList(key);
  const index = list.findIndex(
    (entry) => entry?.email === record?.email || entry?.id === record?.id,
  );

  if (index >= 0) {
    list[index] = record;
  } else {
    list.push(record);
  }

  writeStoredList(key, list);
}

export function buildFounderProfile(user) {
  return {
    ...user.profile,
    founderId: user.id,
    founderName: user.name,
    founderEmail: user.email,
  };
}

export function buildTalentProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    professionalTitle: user.professionalTitle,
    location: user.location,
    bio: user.bio,
    skills: user.skills,
    linkedin: user.linkedin,
    github: user.github,
    website: user.website,
    workExperience: user.workExperience,
    education: user.education,
    certifications: user.certifications,
    portfolioItems: user.portfolioItems,
    availabilityStatus: user.availabilityStatus,
    preferredCommitment: user.preferredCommitment,
    yearsOfExperience: user.yearsOfExperience,
    professionalGoals: user.professionalGoals,
    industryPreferences: user.industryPreferences,
    experience: user.experience,
    availability: user.availability,
    interests: user.interests,
    ...user.profile,
  };
}
