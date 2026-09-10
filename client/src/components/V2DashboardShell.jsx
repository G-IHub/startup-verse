/**
 * V2DashboardShell
 * ─────────────────────────────────────────────────────────────────────────────
 * Top-level shell for the V2 Autonomous OS design. Mounts at /v2/* and acts as
 * the router between V2 screens. Keeps URL and currentPage in sync so deep
 * links and browser-back work as expected.
 *
 * V2 URL → page key mapping:
 *   /v2                 → dashboard
 *   /v2/execution       → execution-engine
 *   /v2/office          → startup-office
 *   /v2/community       → community
 *   /v2/journey         → journey
 *   /v2/ai-staff        → ai-staff
 *   /v2/blueprints      → blueprints
 *   /v2/mentors         → mentors
 *
 * V1 screens are completely untouched — they remain under /home, /office, etc.
 */

import React, { Suspense, lazy, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ── V2 screens (lazy-loaded) ───────────────────────────────────────────────
const V2FounderDashboard = lazy(
  () => import("./dashboards/V2FounderDashboard"),
);
const V2ExecutionEngine = lazy(
  () => import("./dashboards/V2ExecutionEngine"),
);
const V2VirtualOffice = lazy(
  () => import("./dashboards/V2VirtualOffice"),
);

// ── Placeholder for screens not yet built ─────────────────────────────────
function V2ComingSoon({ label, user, onPageChange }) {
  const { cn } = { cn: (...c) => c.filter(Boolean).join(" ") };
  return (
    <div className="flex h-screen items-center justify-center bg-v2-page">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-v2-purple-tint">
          <span className="font-heading text-[28px]">🚀</span>
        </div>
        <div>
          <p className="font-heading text-[18px] font-bold text-v2-heading">{label}</p>
          <p className="mt-1 font-body text-[13px] text-v2-muted">
            This screen is coming in the next build phase.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPageChange("dashboard")}
          className="inline-flex items-center gap-2 rounded-full bg-v2-purple px-4 py-2 font-body text-[12px] font-medium text-white"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// URL ↔ PAGE KEY MAPPING
// ─────────────────────────────────────────────────────────────────────────

const PAGE_TO_PATH = {
  "dashboard":        "/v2",
  "execution-engine": "/v2/execution",
  "startup-office":   "/v2/office",
  "community":        "/v2/community",
  "journey":          "/v2/journey",
  "ai-staff":         "/v2/ai-staff",
  "blueprints":       "/v2/blueprints",
  "mentors":          "/v2/mentors",
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page]),
);

function pageFromLocation(pathname) {
  // Exact match
  const exact = PATH_TO_PAGE[pathname.replace(/\/$/, "")];
  if (exact) return exact;
  // Prefix match for future nested paths
  for (const [path, page] of Object.entries(PATH_TO_PAGE)) {
    if (path !== "/v2" && pathname.startsWith(path + "/")) return page;
  }
  return "dashboard";
}

// ─────────────────────────────────────────────────────────────────────────
// LOADING FALLBACK
// ─────────────────────────────────────────────────────────────────────────

function V2Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-v2-page">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-purple" />
        <p className="font-body text-[12px] text-v2-muted">Loading…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN SHELL
// ─────────────────────────────────────────────────────────────────────────

export default function V2DashboardShell({ user, onLogout, onUpdateUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  // currentPage is derived from the URL (single source of truth)
  const currentPage = pageFromLocation(location.pathname);

  // onPageChange updates the URL → React Router re-renders → currentPage updates
  const handlePageChange = useCallback(
    (page) => {
      const path = PAGE_TO_PATH[page] ?? "/v2";
      if (location.pathname !== path) {
        navigate(path);
      }
    },
    [navigate, location.pathname],
  );

  // ── Render the right screen ──────────────────────────────────────────
  const sharedProps = { user, onPageChange: handlePageChange };

  let screen;

  switch (currentPage) {
    case "dashboard":
      screen = <V2FounderDashboard {...sharedProps} />;
      break;

    case "execution-engine":
      screen = <V2ExecutionEngine {...sharedProps} />;
      break;

    case "startup-office":
      screen = <V2VirtualOffice {...sharedProps} />;
      break;

    case "community":
      screen = (
        <V2ComingSoon label="Community" {...sharedProps} />
      );
      break;

    case "journey":
      screen = (
        <V2ComingSoon label="Journey Stages" {...sharedProps} />
      );
      break;

    case "ai-staff":
      screen = (
        <V2ComingSoon label="AI Staff" {...sharedProps} />
      );
      break;

    case "blueprints":
      screen = (
        <V2ComingSoon label="Blueprint Library" {...sharedProps} />
      );
      break;

    case "mentors":
      screen = (
        <V2ComingSoon label="Mentors" {...sharedProps} />
      );
      break;

    default:
      screen = <V2FounderDashboard {...sharedProps} />;
  }

  return (
    <Suspense fallback={<V2Loading />}>
      {screen}
    </Suspense>
  );
}
