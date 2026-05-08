/**
 * Path-based dashboard navigation: URL is the source of truth for shell pages.
 * Maps between browser paths and DashboardHybrid internal keys.
 */

const DEFAULT_OFFICE_VIEW = "workspace";

/** @typedef {{ currentPage: string, virtualOfficeView?: string, talentDashboardMode?: string, initialProfileEditing?: boolean }} DashboardNavState */

const PATH_TO_PAGE = Object.freeze({
  "/home": "dashboard",
  "/office": "startup-office",
  "/inbox": "inbox",
  "/inbox/received": "inbox:received",
  "/inbox/sent": "inbox:sent",
  "/browse-talent": "team-matching",
  "/analytics": "analytics",
  "/settings": "settings",
  "/performance": "my-performance",
  "/documents": "documents",
  "/pitch-deck": "pitch-deck",
  "/journey": "journey",
  "/journey/ideation": "ideation",
  "/journey/formation": "formation",
  "/journey/team-building": "team-building",
  "/journey/product-dev": "product-dev",
  "/journey/go-to-market": "go-to-market",
  "/journey/operations": "operations",
  "/post-startup": "post-startup",
  "/browse-startups": "browse-startups",
  "/startup-detail": "startup-detail",
  "/talent-profile": "talent-profile",
  "/compensation-demo": "compensation-demo",
});

/** All first-segment paths handled by the authenticated dashboard shell (for guards). */
export const DASHBOARD_PATH_PREFIXES = Object.freeze(
  new Set(
    [
      "home",
      "office",
      "inbox",
      "browse-talent",
      "chat",
      "analytics",
      "settings",
      "performance",
      "documents",
      "pitch-deck",
      "journey",
      "post-startup",
      "browse-startups",
      "startup-detail",
      "talent-profile",
      "compensation-demo",
    ],
  ),
);

function normalizePath(pathname) {
  if (!pathname || pathname === "") return "/";
  const noTrail = pathname.replace(/\/+$/, "");
  return noTrail === "" ? "/" : noTrail;
}

function chatPageForRole(role) {
  if (role === "talent") return "talent-chat";
  return "founder-chat";
}

/**
 * Returns true if this pathname should be served only when logged in (dashboard shell).
 */
export function isProtectedDashboardPath(pathname) {
  const p = normalizePath(pathname);
  if (p === "/") return false;
  const seg = p.split("/").filter(Boolean)[0];
  return seg ? DASHBOARD_PATH_PREFIXES.has(seg) : false;
}

/**
 * @returns {DashboardNavState | null} null if pathname is not a dashboard route
 */
export function pathToDashboardState(pathname, search, role) {
  const path = normalizePath(pathname);
  const q = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  if (path === "/office") {
    const view = q.get("view") || DEFAULT_OFFICE_VIEW;
    return {
      currentPage: "startup-office",
      virtualOfficeView: view,
    };
  }

  if (path === "/home") {
    const mode = q.get("mode") || "overview";
    return {
      currentPage: "dashboard",
      talentDashboardMode: role === "talent" ? mode : undefined,
    };
  }

  if (path === "/settings") {
    const edit =
      q.get("editProfile") === "1" || q.get("editProfile") === "true";
    return {
      currentPage: "settings",
      initialProfileEditing: Boolean(edit),
    };
  }

  if (path === "/chat") {
    return { currentPage: chatPageForRole(role) };
  }

  if (path === "/analytics") {
    if (role !== "founder") return null;
    return { currentPage: "analytics" };
  }

  if (path === "/performance") {
    if (role !== "team-member" && role !== "team") return null;
    return { currentPage: "my-performance" };
  }

  if (path === "/browse-talent") {
    if (role !== "founder" && role !== "talent") return null;
    return { currentPage: role === "talent" ? "browse-startups" : "team-matching" };
  }

  const page = PATH_TO_PAGE[path];
  if (!page) return null;

  if (page === "compensation-demo") {
    const allow =
      typeof import.meta !== "undefined" &&
      (import.meta.env?.DEV ||
        import.meta.env?.VITE_INCLUDE_COMPENSATION_DEMO === "true");
    if (!allow) return null;
  }

  return { currentPage: page };
}

/**
 * @param {DashboardNavState & { taskId?: string, announcementId?: string }} state
 * @returns {string} pathname + optional search
 */
export function dashboardStateToPath(state) {
  const {
    currentPage,
    virtualOfficeView,
    talentDashboardMode,
    initialProfileEditing,
  } = state;

  switch (currentPage) {
    case "dashboard": {
      const mode =
        talentDashboardMode && talentDashboardMode !== "overview"
          ? talentDashboardMode
          : null;
      return mode ? `/home?mode=${encodeURIComponent(mode)}` : "/home";
    }
    case "startup-office": {
      const v = virtualOfficeView || DEFAULT_OFFICE_VIEW;
      if (!v || v === DEFAULT_OFFICE_VIEW) return "/office";
      return `/office?view=${encodeURIComponent(v)}`;
    }
    case "inbox":
      return "/inbox";
    case "inbox:received":
      return "/inbox/received";
    case "inbox:sent":
      return "/inbox/sent";
    case "team-matching":
      return "/browse-talent";
    case "founder-chat":
    case "talent-chat":
      return "/chat";
    case "analytics":
      return "/analytics";
    case "settings":
      return initialProfileEditing ? "/settings?editProfile=1" : "/settings";
    case "profile":
      return "/settings?editProfile=1";
    case "my-performance":
      return "/performance";
    case "documents":
      return "/documents";
    case "pitch-deck":
      return "/pitch-deck";
    case "journey":
      return "/journey";
    case "ideation":
      return "/journey/ideation";
    case "formation":
      return "/journey/formation";
    case "team-building":
      return "/journey/team-building";
    case "product-dev":
      return "/journey/product-dev";
    case "go-to-market":
      return "/journey/go-to-market";
    case "operations":
      return "/journey/operations";
    case "post-startup":
      return "/post-startup";
    case "browse-startups":
      return "/browse-startups";
    case "startup-detail":
      return "/startup-detail";
    case "talent-profile":
      return "/talent-profile";
    case "compensation-demo":
      return "/compensation-demo";
    default:
      return "/home";
  }
}

/** Paths registered as `<Route>` elements for the dashboard shell (Phase 1 + internal pages). */
export const DASHBOARD_ROUTE_PATHS = Object.freeze([
  "/home",
  "/office",
  "/inbox",
  "/inbox/received",
  "/inbox/sent",
  "/browse-talent",
  "/chat",
  "/analytics",
  "/settings",
  "/performance",
  "/documents",
  "/pitch-deck",
  "/journey",
  "/journey/ideation",
  "/journey/formation",
  "/journey/team-building",
  "/journey/product-dev",
  "/journey/go-to-market",
  "/journey/operations",
  "/post-startup",
  "/browse-startups",
  "/startup-detail",
  "/talent-profile",
  "/compensation-demo",
]);

/**
 * Map legacy query intent (resolveDashboardIntent) to a pathname.
 * @param {{ page?: string, virtualOfficeView?: string } | null} intent
 * @param {string} role
 */
export function dashboardIntentToPath(intent, role) {
  if (!intent?.page) return null;

  /** @type {DashboardNavState} */
  const state = {
    currentPage: intent.page,
    ...(intent.page === "startup-office"
      ? { virtualOfficeView: intent.virtualOfficeView || DEFAULT_OFFICE_VIEW }
      : {}),
  };

  if (state.currentPage === "founder-chat" || state.currentPage === "talent-chat") {
    state.currentPage = chatPageForRole(role);
  }

  return dashboardStateToPath(state);
}
