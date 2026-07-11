/**
 * Canonical deep-link builders and parsers for dashboard navigation.
 * URLs carry entity context via query params; legacy actionUrls are normalized at click time.
 */

function chatPageForRole(role) {
  if (role === "talent") return "talent-chat";
  return "founder-chat";
}

function appendQuery(path, params) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of entries) {
    qs.set(key, String(value));
  }
  return `${path}?${qs.toString()}`;
}

/** @param {string} peerUserId */
export function buildChatPath(peerUserId) {
  if (!peerUserId) return "/chat";
  return appendQuery("/chat", { with: peerUserId });
}

/**
 * @param {{ tab?: string, taskId?: string, announcementId?: string, winId?: string, deliverableId?: string, mentorId?: string, cohortId?: string, view?: string }} params
 */
export function buildOfficePath(params = {}) {
  const { view, tab, taskId, announcementId, winId, deliverableId, mentorId, cohortId } =
    params;
  return appendQuery("/office", {
    view: view && view !== "workspace" ? view : undefined,
    tab,
    taskId,
    announcementId,
    winId,
    deliverableId,
    mentorId,
    cohortId,
  });
}

/** @param {string} startupId */
export function buildStartupDetailPath(startupId) {
  if (!startupId) return "/startup-detail";
  return appendQuery("/startup-detail", { id: startupId });
}

/** @param {string} talentId */
export function buildTalentProfilePath(talentId) {
  if (!talentId) return "/talent-profile";
  return appendQuery("/talent-profile", { id: talentId });
}

/**
 * Legacy inbox URLs redirect to the notification hub (bell).
 * @param {{ tab?: "received"|"sent", invitationId?: string, interestId?: string }} params
 */
export function buildInboxPath(params = {}) {
  return appendQuery("/home", {
    openNotifications: "1",
    invitationId: params.invitationId || undefined,
    interestId: params.interestId || undefined,
  });
}

/**
 * Parse a notification actionUrl (and optional metadata) into dashboard navigation intent.
 * @param {string} url
 * @param {Record<string, unknown>} [metadata]
 * @param {string} [role]
 * @returns {{ page: string, options?: Record<string, unknown> } | null}
 */
export function parseDeepLink(url, metadata = {}, role = "founder") {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  const meta = metadata && typeof metadata === "object" ? metadata : {};

  if (/^https?:\/\//i.test(trimmed)) return null;
  if (trimmed.includes("/room/") || trimmed.includes("/office/room/")) return null;

  if (trimmed.startsWith("/?")) {
    return parseLegacyQueryUrl(trimmed.slice(1), meta, role);
  }

  let pathname = trimmed;
  let search = "";
  const qIndex = trimmed.indexOf("?");
  if (qIndex >= 0) {
    pathname = trimmed.slice(0, qIndex);
    search = trimmed.slice(qIndex);
  }

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (pathname === "/chat") {
    const withUser =
      params.get("with") ||
      meta.peerUserId ||
      meta.messageUserId ||
      meta.founderId ||
      meta.talentId ||
      "";
    return {
      page: chatPageForRole(role),
      ...(withUser ? { options: { messageUserId: String(withUser) } } : {}),
    };
  }

  if (pathname === "/office" || pathname === "/tasks" || pathname.startsWith("/tasks/")) {
    const taskId =
      params.get("taskId") ||
      (pathname.startsWith("/tasks/") ? decodeURIComponent(pathname.split("/")[2] || "") : "") ||
      meta.taskId ||
      "";
    const tab = params.get("tab") || (taskId ? "tasks" : meta.tab || "");
    const announcementId = params.get("announcementId") || meta.announcementId || "";
    const winId = params.get("winId") || meta.winId || "";
    const deliverableId = params.get("deliverableId") || meta.deliverableId || "";

    if (tab === "invitations" || meta.invitationId) {
      const founderId = meta.founderId || meta.senderId || "";
      if (founderId) {
        return {
          page: chatPageForRole(role),
          options: { messageUserId: String(founderId) },
        };
      }
      return {
        page: "inbox",
        options: { invitationId: String(meta.invitationId || params.get("invitationId") || "") },
      };
    }

    return {
      page: "startup-office",
      options: {
        officeTab: tab || undefined,
        ...(taskId ? { taskId: String(taskId) } : {}),
        ...(announcementId ? { announcementId: String(announcementId) } : {}),
        ...(winId ? { winId: String(winId) } : {}),
        ...(deliverableId ? { deliverableId: String(deliverableId) } : {}),
        openTeamHub: Boolean(announcementId || winId),
      },
    };
  }

  if (pathname.includes("/tasks/")) {
    const match = pathname.match(/\/tasks\/([^/?#]+)/);
    const taskId = match ? decodeURIComponent(match[1]) : meta.taskId || "";
    return {
      page: "startup-office",
      options: { taskId: String(taskId), officeTab: "tasks" },
    };
  }

  if (pathname.includes("/announcements/")) {
    const match = pathname.match(/\/announcements\/([^/?#]+)/);
    const announcementId = match ? decodeURIComponent(match[1]) : meta.announcementId || "";
    return {
      page: "startup-office",
      options: {
        announcementId: String(announcementId),
        officeTab: "announcements",
        openTeamHub: true,
      },
    };
  }

  if (pathname.includes("/wins/")) {
    const match = pathname.match(/\/wins\/([^/?#]+)/);
    const winId = match ? decodeURIComponent(match[1]) : meta.winId || "";
    return {
      page: "startup-office",
      options: { winId: String(winId), officeTab: "wins", openTeamHub: true },
    };
  }

  if (pathname.includes("/team")) {
    const match = pathname.match(/\/team\/messages\/([^/?#]+)/);
    const messageUserId =
      (match ? decodeURIComponent(match[1]) : "") ||
      meta.peerUserId ||
      meta.talentId ||
      meta.founderId ||
      "";
    if (messageUserId) {
      return {
        page: chatPageForRole(role),
        options: { messageUserId: String(messageUserId) },
      };
    }
    return { page: "startup-office", options: { officeTab: "team", openTeamHub: true } };
  }

  if (pathname === "/startup-detail" || pathname.startsWith("/startup-detail")) {
    const id = params.get("id") || meta.startupId || "";
    return {
      page: "startup-detail",
      ...(id ? { options: { startupId: String(id) } } : {}),
    };
  }

  if (pathname === "/talent-profile" || pathname.startsWith("/talent-profile")) {
    const id = params.get("id") || meta.talentId || meta.userId || "";
    return {
      page: "talent-profile",
      ...(id ? { options: { talentId: String(id) } } : {}),
    };
  }

  if (pathname === "/inbox" || pathname.startsWith("/inbox")) {
    const invitationId = params.get("invitationId") || meta.invitationId || "";
    const interestId = params.get("interestId") || meta.interestId || "";
    return {
      page: "inbox",
      options: {
        ...(invitationId ? { invitationId: String(invitationId) } : {}),
        ...(interestId ? { interestId: String(interestId) } : {}),
      },
    };
  }

  if (pathname.includes("/dashboard") || pathname === "/home") {
    const invitationId = params.get("invitationId") || meta.invitationId || "";
    const interestId = params.get("interestId") || meta.interestId || "";
    const openNotifications =
      params.get("openNotifications") === "1" ||
      params.get("openNotifications") === "true" ||
      Boolean(invitationId || interestId);
    if (openNotifications) {
      return {
        page: "inbox",
        options: {
          ...(invitationId ? { invitationId: String(invitationId) } : {}),
          ...(interestId ? { interestId: String(interestId) } : {}),
        },
      };
    }
    return { page: "dashboard" };
  }

  if (pathname.includes("/weekly-review")) {
    return { page: "startup-office", options: { officeTab: "weekly" } };
  }

  if (pathname.includes("/milestones") || pathname.includes("/outcomes")) {
    return { page: "startup-office", options: { officeTab: "weekly" } };
  }

  if (params.get("invitation")) {
    return null;
  }

  return { page: "dashboard" };
}

/**
 * @param {string} search - without leading ?
 * @param {Record<string, unknown>} meta
 * @param {string} role
 */
function parseLegacyQueryUrl(search, meta, role) {
  const params = new URLSearchParams(search);
  const view = params.get("view");
  const tab = params.get("tab") || "";

  if (view === "virtual-office" || view === "organizations") {
    const taskId = params.get("taskId") || meta.taskId || "";
    const announcementId = params.get("announcementId") || meta.announcementId || "";
    const winId = params.get("winId") || meta.winId || "";
    const deliverableId = params.get("deliverableId") || meta.deliverableId || "";
    const invitationId = params.get("invitationId") || meta.invitationId || "";

    if (tab === "invitations" || invitationId) {
      const founderId = meta.founderId || meta.senderId || "";
      if (founderId) {
        return {
          page: chatPageForRole(role),
          options: { messageUserId: String(founderId) },
        };
      }
      return {
        page: "inbox",
        options: { invitationId: String(invitationId) },
      };
    }

    if (tab === "inbox") {
      return { page: "inbox" };
    }

    const messageUserId =
      meta.peerUserId ||
      meta.messageUserId ||
      (tab === "team" ? meta.talentId || meta.teamMemberId : "") ||
      "";

    if (messageUserId && (tab === "messages" || tab === "team")) {
      return {
        page: chatPageForRole(role),
        options: { messageUserId: String(messageUserId) },
      };
    }

    return {
      page: "startup-office",
      options: {
        officeTab: tab || undefined,
        ...(taskId ? { taskId: String(taskId) } : {}),
        ...(announcementId ? { announcementId: String(announcementId), openTeamHub: true } : {}),
        ...(winId ? { winId: String(winId), openTeamHub: true } : {}),
        ...(deliverableId ? { deliverableId: String(deliverableId) } : {}),
      },
    };
  }

  if (view === "mentor-portal") {
    return { page: "dashboard" };
  }

  if (params.get("invitation")) {
    return null;
  }

  return { page: "dashboard" };
}
