/**
 * Path-based dashboard navigation: URL is the source of truth for shell pages.
 * Maps between browser paths and DashboardHybrid internal keys.
 */

import { parseOfficeCallRoute } from "../utils/callRouteUtils.js";

const DEFAULT_OFFICE_VIEW = "workspace";

/** @typedef {{ currentPage: string, virtualOfficeView?: string, talentDashboardMode?: string, initialProfileEditing?: boolean, messageUserId?: string, taskId?: string, announcementId?: string, winId?: string, deliverableId?: string, officeTab?: string, startupId?: string, talentId?: string, invitationId?: string, projectSlug?: string, milestoneId?: string, projectTaskId?: string }} DashboardNavState */

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
      "projects",
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

function canAccessProjects(role) {
  return role === "founder" || role === "team-member" || role === "team";
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

  if (path === "/office" || path.startsWith("/office/call/")) {
    const view = q.get("view") || DEFAULT_OFFICE_VIEW;
    const tab = q.get("tab") || undefined;
    const callRoute = path.startsWith("/office/call/")
      ? parseOfficeCallRoute(path, search)
      : null;
    return {
      currentPage: "startup-office",
      virtualOfficeView: view,
      officeTab: tab,
      taskId: q.get("taskId") || undefined,
      announcementId: q.get("announcementId") || undefined,
      winId: q.get("winId") || undefined,
      deliverableId: q.get("deliverableId") || undefined,
      activeCallRoom: callRoute?.roomName,
      activeCallType: callRoute?.callType,
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
    const withUser = q.get("with") || undefined;
    return {
      currentPage: chatPageForRole(role),
      ...(withUser ? { messageUserId: withUser } : {}),
    };
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

  if (path === "/startup-detail") {
    const id = q.get("id") || undefined;
    return {
      currentPage: "startup-detail",
      ...(id ? { startupId: id } : {}),
    };
  }

  if (path === "/talent-profile") {
    const id = q.get("id") || undefined;
    return {
      currentPage: "talent-profile",
      ...(id ? { talentId: id } : {}),
    };
  }

  if (path === "/inbox" || path === "/inbox/received" || path === "/inbox/sent") {
    const invitationId = q.get("invitationId") || undefined;
    const page =
      path === "/inbox/sent"
        ? "inbox:sent"
        : path === "/inbox/received"
          ? "inbox:received"
          : "inbox";
    return {
      currentPage: page,
      ...(invitationId ? { invitationId } : {}),
    };
  }

  if (path === "/projects") {
    if (!canAccessProjects(role)) return null;
    return { currentPage: "projects-workspace" };
  }

  const projectTaskMatch = path.match(
    /^\/projects\/([^/]+)\/tasks\/([^/]+)$/,
  );
  if (projectTaskMatch) {
    if (!canAccessProjects(role)) return null;
    const [, projectSlug, projectTaskId] = projectTaskMatch;
    return {
      currentPage: "projects-workspace",
      projectSlug: decodeURIComponent(projectSlug),
      projectTaskId: decodeURIComponent(projectTaskId),
    };
  }

  const projectMilestoneMatch = path.match(
    /^\/projects\/([^/]+)\/milestones\/([^/]+)$/,
  );
  if (projectMilestoneMatch) {
    if (!canAccessProjects(role)) return null;
    const [, projectSlug, milestoneId] = projectMilestoneMatch;
    return {
      currentPage: "projects-workspace",
      projectSlug: decodeURIComponent(projectSlug),
      milestoneId: decodeURIComponent(milestoneId),
    };
  }

  const projectSlugMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectSlugMatch) {
    if (!canAccessProjects(role)) return null;
    return {
      currentPage: "projects-workspace",
      projectSlug: decodeURIComponent(projectSlugMatch[1]),
    };
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
function appendEntityParams(path, params) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of entries) {
    qs.set(key, String(value));
  }
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${qs.toString()}`;
}

export function dashboardStateToPath(state) {
  const {
    currentPage,
    virtualOfficeView,
    talentDashboardMode,
    initialProfileEditing,
    messageUserId,
    taskId,
    announcementId,
    winId,
    deliverableId,
    officeTab,
    startupId,
    talentId,
    invitationId,
    projectSlug,
    milestoneId,
    projectTaskId,
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
      return appendEntityParams("/office", {
        ...(v && v !== DEFAULT_OFFICE_VIEW ? { view: v } : {}),
        ...(officeTab ? { tab: officeTab } : {}),
        ...(taskId ? { taskId } : {}),
        ...(announcementId ? { announcementId } : {}),
        ...(winId ? { winId } : {}),
        ...(deliverableId ? { deliverableId } : {}),
      });
    }
    case "inbox":
      return invitationId
        ? appendEntityParams("/inbox", { invitationId })
        : "/inbox";
    case "inbox:received":
      return invitationId
        ? appendEntityParams("/inbox/received", { invitationId })
        : "/inbox/received";
    case "inbox:sent":
      return "/inbox/sent";
    case "team-matching":
      return "/browse-talent";
    case "founder-chat":
    case "talent-chat":
      return messageUserId
        ? appendEntityParams("/chat", { with: messageUserId })
        : "/chat";
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
      return startupId
        ? appendEntityParams("/startup-detail", { id: startupId })
        : "/startup-detail";
    case "talent-profile":
      return talentId
        ? appendEntityParams("/talent-profile", { id: talentId })
        : "/talent-profile";
    case "compensation-demo":
      return "/compensation-demo";
    case "projects-workspace": {
      if (!projectSlug) return "/projects";
      const encoded = encodeURIComponent(projectSlug);
      if (projectTaskId) {
        return `/projects/${encoded}/tasks/${encodeURIComponent(projectTaskId)}`;
      }
      if (milestoneId) {
        return `/projects/${encoded}/milestones/${encodeURIComponent(milestoneId)}`;
      }
      return `/projects/${encoded}`;
    }
    default:
      return "/home";
  }
}

/** Paths registered as `<Route>` elements for the dashboard shell (Phase 1 + internal pages). */
export const DASHBOARD_ROUTE_PATHS = Object.freeze([
  "/home",
  "/office",
  "/office/call/:roomName",
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
  "/projects",
  "/projects/:slug",
  "/projects/:slug/milestones/:milestoneId",
  "/projects/:slug/tasks/:taskId",
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
