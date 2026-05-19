/**
 * COHORT DASHBOARD WITH SIDEBAR NAVIGATION
 * Modern multi-page architecture with clean left sidebar
 * Mobile-responsive with hamburger menu
 */
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Menu,
  Plus,
  Download,
  Loader2,
  Rocket,
  ChevronRight,
  Mail,
  RotateCw,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import OrganizationSidebar from "./OrganizationSidebar";
import {
  SectionCard,
  SectionHeader,
  ListRow,
  StatusBadge,
  EmptyStateBlock,
} from "./_primitives";
import CohortHomePage from "./CohortHomePage";
import InviteStartupModal from "./InviteStartupModal";
import StartupSnapshotModal from "./StartupSnapshotModal";
import PortfolioOverview from "./PortfolioOverview";
import ProgramMilestones from "./ProgramMilestones";
import CohortAnalyticsDashboard from "./CohortAnalyticsDashboard";
import DeliverablesManager from "./DeliverablesManager";
import ResourceLibrary from "./ResourceLibrary";
import EventManager from "./EventManager";
import MentorNetwork from "./MentorNetwork";
import CommunicationCenter from "./CommunicationCenter";
import OrganizationSettings from "./OrganizationSettings";
import { getCohort } from "../../utils/organizationHelpersBackend";
import {
  checkAdminStatus,
  getCohortInvitationsPage,
  cancelInvitation,
  resendInvitation,
  getCohortMembersPage,
  getCohortBadgeCounts,
  downloadCohortExport,
} from "../../utils/api/organizationApi";
import { useOrgListQuery } from "../../hooks/useOrgListQuery";
import { useOrgRealtime } from "../../hooks/useOrgRealtime";
import PaginationControls from "../shared/PaginationControls";

function mapMemberToStartupRow(m) {
  return {
    startupId: m.founderId,
    startupName: m.startupName || "Unnamed Startup",
    founderName: m.founderName || "",
    founderEmail: m.founderEmail || "",
    stageName: m.currentStage || m.startup?.stage || "—",
    teamSize: m.progress?.teamSize ?? 1,
    status: m.progress?.activityStatus || "stalled",
    executionSummary: {
      weeklyStreak: m.progress?.weeklyOutcomeStreak ?? 0,
      currentOutcome: m.progress?.currentMilestone
        ? { title: m.progress.currentMilestone, progress: 50, daysLeft: 7 }
        : null,
      milestonesCompleted: m.progress?.completedMilestones ?? 0,
      tasksCompletedThisWeek: m.progress?.tasksCompletedThisWeek ?? 0,
    },
    lastActivity: m.progress?.lastActive || m.joinedAt,
    joinedCohortAt: m.joinedAt,
  };
}

function CohortMembersList({ cohortId, isAdmin, onViewStartup, onInvite }) {
  const {
    items,
    total,
    limit,
    loading,
    q,
    setSearch,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) => getCohortMembersPage(cohortId, params),
      [cohortId],
    ),
    initialLimit: 25,
  });

  const rows = items.map(mapMemberToStartupRow);

  return (
    <>
      <SectionCard>
        <SectionCard.Body className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              value={q}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by founder or startup..."
              className="pl-8 font-body text-[13px]"
            />
          </div>
        </SectionCard.Body>
      </SectionCard>
      <SectionCard>
        <SectionCard.Header
          title="Cohort Members"
          description={`${total} startup${total !== 1 ? "s" : ""} in this cohort`}
          action={
            isAdmin ? (
              <Button
                size="sm"
                onClick={onInvite}
                className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] hover:bg-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite Startup
              </Button>
            ) : null
          }
        />
        <SectionCard.Body>
          {loading ? (
            <div className="animate-pulse p-8 text-center font-body text-[13px] text-text-muted">
              Loading members...
            </div>
          ) : rows.length === 0 ? (
            <EmptyStateBlock
              variant="centered"
              icon={Rocket}
              tone="info"
              title="No startups yet"
              description='Click "Invite Startup" to add startups to this cohort'
              action={
                isAdmin ? (
                  <Button size="sm" onClick={onInvite} className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Startup
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="space-y-2">
              {rows.map((startup) => (
                <ListRow
                  key={startup.startupId}
                  onClick={() => onViewStartup(startup)}
                  leading={
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-heading text-[13px] font-bold text-primary">
                      {(startup.startupName || "?").charAt(0).toUpperCase()}
                    </div>
                  }
                  title={startup.startupName}
                  description={startup.founderName}
                  trailing={
                    <>
                      <StatusBadge status={startup.status} />
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard.Body>
      </SectionCard>
      {!loading && total > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNext={nextPage}
          onPrev={prevPage}
          onGoToPage={goToPage}
          totalItems={total}
          pageSize={limit}
        />
      )}
    </>
  );
}

function formatInvitationRetryAfter(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "a moment";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.ceil(seconds / 60);
  return `${m} min${m === 1 ? "" : "s"}`;
}

function PendingInvitationsPanel({ cohortId, isAdmin, refreshSignal = 0 }) {
  const [invitationBusyId, setInvitationBusyId] = useState(null);

  const {
    items: pendingInvitations,
    total,
    limit,
    loading,
    q,
    setSearch,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) => getCohortInvitationsPage(cohortId, { ...params, status: "pending" }),
      [cohortId],
    ),
    initialLimit: 25,
    autoFetch: isAdmin,
  });

  useEffect(() => {
    if (!isAdmin || refreshSignal === 0) return;
    refresh().catch(() => {});
  }, [refreshSignal, isAdmin, refresh]);

  const handleResendInvitation = async (invitation) => {
    setInvitationBusyId(invitation.id);
    try {
      await resendInvitation(invitation.id);
      await refresh();
      toast.success("Invitation resent.");
    } catch (err) {
      if (err?.status === 429 && err?.code === "INVITATION_RESEND_TOO_SOON") {
        toast.warning(
          `You can resend this invitation in ${formatInvitationRetryAfter(err.retryAfterSeconds)}.`,
        );
        return;
      }
      toast.error(err?.message || "Failed to resend invitation.");
    } finally {
      setInvitationBusyId(null);
    }
  };

  const handleCancelInvitation = async (invitation) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Cancel invitation to ${invitation.email || invitation.founderName || "this founder"}?`,
      )
    ) {
      return;
    }
    setInvitationBusyId(invitation.id);
    try {
      await cancelInvitation(invitation.id);
      await refresh();
      toast.success("Invitation cancelled.");
    } catch (err) {
      toast.error(err?.message || "Failed to cancel invitation.");
    } finally {
      setInvitationBusyId(null);
    }
  };

  if (!isAdmin) return null;
  if (!loading && total === 0 && !q) return null;

  return (
    <>
      <SectionCard>
        <SectionCard.Body className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              value={q}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email…"
              className="pl-8 font-body text-[13px]"
            />
          </div>
        </SectionCard.Body>
      </SectionCard>
      <SectionCard>
        <SectionCard.Header
          title="Pending invitations"
          description={
            loading
              ? "Loading…"
              : `${total} awaiting response`
          }
        />
        <SectionCard.Body>
          {loading ? (
            <div className="animate-pulse p-6 text-center font-body text-[13px] text-text-muted">
              Loading invitations…
            </div>
          ) : pendingInvitations.length === 0 ? (
            <EmptyStateBlock
              variant="centered"
              icon={Mail}
              tone="info"
              title="No matching invitations"
              description={q ? "Try a different search term." : "No pending invitations."}
            />
          ) : (
            <div className="space-y-2">
              {pendingInvitations.map((inv) => {
                const lastSent = inv.lastSentAt
                  ? new Date(inv.lastSentAt)
                  : inv.createdAt
                    ? new Date(inv.createdAt)
                    : null;
                return (
                  <ListRow
                    key={inv.id}
                    leading={
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                    }
                    title={inv.founderName || inv.email || "Pending invite"}
                    description={
                      <span className="font-body text-[12px] text-text-muted">
                        {inv.email}
                        {lastSent ? ` · last sent ${lastSent.toLocaleString()}` : ""}
                        {inv.invitedBy?.name ? ` · by ${inv.invitedBy.name}` : ""}
                      </span>
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(inv)}
                          disabled={invitationBusyId === inv.id}
                          className="h-8 rounded-input font-body text-[12px]"
                        >
                          <RotateCw className="mr-1 h-3.5 w-3.5" />
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelInvitation(inv)}
                          disabled={invitationBusyId === inv.id}
                          className="h-8 rounded-input border-[#ff4f6b]/40 font-body text-[12px] text-[#ff4f6b] hover:bg-[#ff4f6b]/5"
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </SectionCard.Body>
      </SectionCard>
      {!loading && total > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNext={nextPage}
          onPrev={prevPage}
          onGoToPage={goToPage}
          totalItems={total}
          pageSize={limit}
        />
      )}
    </>
  );
}

export default function CohortDashboardWithSidebar({
  cohortId,
  organizationId,
  organizationName,
  organizationType,
  userId,
  isAdmin = true,
  userName,
  user,
  onLogout,
  onUpdateUser,
  onBack,
}) {
  const [currentPage, setCurrentPage] = useState("home");
  const [cohort, setCohort] = useState(null);
  const [cohortMembers, setCohortMembers] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [invitationsRefreshKey, setInvitationsRefreshKey] = useState(0);
  const [badgeCounts, setBadgeCounts] = useState({
    unreadMessages: 0,
    pendingSubmissions: 0,
    newAnnouncements: 0,
    upcomingEventsNext7d: 0,
  });
  const [exporting, setExporting] = useState(false);

  const refreshBadgeCounts = useCallback(async () => {
    if (!cohortId) return;
    try {
      const counts = await getCohortBadgeCounts(cohortId);
      if (counts && typeof counts === "object") {
        setBadgeCounts({
          unreadMessages: Number(counts.unreadMessages) || 0,
          pendingSubmissions: Number(counts.pendingSubmissions) || 0,
          newAnnouncements: Number(counts.newAnnouncements) || 0,
          upcomingEventsNext7d: Number(counts.upcomingEventsNext7d) || 0,
        });
      }
    } catch (err) {
      console.error("Failed to refresh badge counts:", err);
    }
  }, [cohortId]);

  useEffect(() => {
    if (!cohortId) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await refreshBadgeCounts();
    };
    run();
    const intervalId = setInterval(() => {
      if (!cancelled) refreshBadgeCounts();
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [cohortId, refreshBadgeCounts]);

  useOrgRealtime(organizationId, null, {
    onMessage: () => refreshBadgeCounts(),
    onDeliverable: () => refreshBadgeCounts(),
    onAnnouncement: () => refreshBadgeCounts(),
    onEvent: () => refreshBadgeCounts(),
    onInvitation: () => {
      refreshBadgeCounts();
      setInvitationsRefreshKey((k) => k + 1);
    },
    onReconnect: () => refreshBadgeCounts(),
  });

  useEffect(() => {
    // Reset to home page and reload when cohortId changes
    setCurrentPage("home");
    setLoading(true);
    setError(null);
    loadData();
  }, [cohortId]);
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const cohortData = await getCohort(cohortId);
      if (!cohortData) {
        setError("Cohort not found");
        setLoading(false);
        return;
      }
      setCohort(cohortData);

      // Check admin and creator status
      try {
        const adminStatus = await checkAdminStatus(organizationId, userId);
        setIsCreator(adminStatus.isCreator);
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }

    } catch (error) {
      console.error("Failed to load cohort data:", error);
      setError("Failed to load cohort data");
    } finally {
      setLoading(false);
    }
  };
  const handleExport = async () => {
    try {
      setExporting(true);
      const { truncated } = await downloadCohortExport(cohortId);
      if (truncated) {
        toast.info(
          "Export includes up to 500 startups. Contact support if you need a full export.",
        );
      }
    } catch (err) {
      console.error("Cohort export failed:", err);
      toast.error(err?.message || "Failed to export cohort data");
    } finally {
      setExporting(false);
    }
  };
  const handleViewStartup = (startup) => {
    setSelectedStartup(startup);
    setShowSnapshotModal(true);
  };

  useEffect(() => {
    if (currentPage !== "communication") return;
    let cancelled = false;
    getCohortMembersPage(cohortId, { limit: 100 })
      .then((page) => {
        if (cancelled) return;
        setCohortMembers(
          page.items.map((m) => ({
            founderId: m.founderId,
            founderName: m.founderName || "",
            startupName: m.startupName || "",
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setCohortMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPage, cohortId]);

  const renderPageContent = () => {
    if (!cohort) return null;
    switch (currentPage) {
      case "home":
        return (
          <CohortHomePage
            cohort={cohort}
            onNavigate={setCurrentPage}
            onInviteClick={() => setShowInviteModal(true)}
            isAdmin={isAdmin}
            organizationName={organizationName}
            organizationType={organizationType}
            userName={userName}
            onBack={onBack}
          />
        );
      case "portfolio":
        return (
          <PortfolioOverview
            cohortId={cohortId}
            onViewStartup={(founderId) => {
              handleViewStartup({ startupId: founderId });
            }}
          />
        );
      case "analytics":
        return <CohortAnalyticsDashboard cohortId={cohortId} />;
      case "milestones":
        return (
          <ProgramMilestones
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={isAdmin}
          />
        );
      case "deliverables":
        return (
          <DeliverablesManager
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={isAdmin}
          />
        );
      case "events":
        return (
          <EventManager
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={isAdmin}
          />
        );
      case "communication":
        return (
          <CommunicationCenter
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            userName="Admin User"
            isAdmin={isAdmin}
            cohortMembers={cohortMembers}
          />
        );
      case "mentors":
        return (
          <MentorNetwork
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={isAdmin}
          />
        );
      case "resources":
        return (
          <ResourceLibrary
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={isAdmin}
          />
        );
      case "members":
        return (
          <div className="space-y-6">
            <PendingInvitationsPanel
              cohortId={cohortId}
              isAdmin={isAdmin}
              refreshSignal={invitationsRefreshKey}
            />
            <CohortMembersList
              cohortId={cohortId}
              isAdmin={isAdmin}
              onViewStartup={handleViewStartup}
              onInvite={() => setShowInviteModal(true)}
            />
          </div>
        );
      case "settings":
        return (
          <OrganizationSettings
            organizationId={organizationId}
            userId={userId}
            isCreator={isCreator}
            onUpdate={loadData}
          />
        );
      default:
        return null;
    }
  };
  const getPageTitle = () => {
    const titles = {
      home: "Dashboard Overview",
      portfolio: "Portfolio Health",
      analytics: "Analytics & Insights",
      milestones: "Program Milestones",
      deliverables: "Deliverables & Submissions",
      events: "Cohort Agenda",
      communication: "Communication Center",
      mentors: "Mentor Network",
      resources: "Resource Library",
      members: "Cohort Members",
      settings: "Settings",
    };
    return titles[currentPage];
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-body text-[13px] text-text-muted">
          Loading cohort...
        </div>
      </div>
    );
  }
  if (error || !cohort) {
    return (
      <Card className="rounded-card border border-surface-border bg-white shadow-soft">
        <CardContent className="p-8 text-center">
          <p className="font-body text-[13px] text-[#ff4f6b]">
            {error || "Cohort not found"}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex h-full bg-surface-page">
      <OrganizationSidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        organizationName={organizationName}
        cohortName={cohort.name}
        userName={userName}
        stats={cohort.stats}
        badgeCounts={badgeCounts}
        onLogout={onLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-surface-border bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.05)] px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden h-9 w-9 p-0 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-base md:text-lg font-bold text-text-heading truncate">
                {cohort.name}
              </h2>
              <p className="font-body text-[12px] md:text-sm text-text-body truncate">
                {cohort.description ||
                  `${cohort.stats?.totalStartups || 0} startups`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
              >
                ← Back to program
              </Button>
            )}
            {isAdmin && (
              <>
                {currentPage === "home" && (
                  <Button
                    size="sm"
                    onClick={() => setShowInviteModal(true)}
                    className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] hover:bg-primary-hover"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Startup
                  </Button>
                )}
                {currentPage !== "home" && (
                  <>
                    {currentPage === "members" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInviteModal(true)}
                        className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary hidden sm:flex"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      disabled={exporting}
                      className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
                    >
                      {exporting ? (
                        <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                      ) : (
                        <Download className="w-4 h-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">
                        {exporting ? "Exporting…" : "Export"}
                      </span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-page">
          {renderPageContent()}
        </div>
      </div>
      <InviteStartupModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        cohortId={cohortId}
        cohortName={cohort.name}
        organizationId={organizationId}
        organizationName={organizationName}
        userId={userId}
        onSuccess={() => {
          loadData();
          setInvitationsRefreshKey((k) => k + 1);
        }}
      />
      {selectedStartup && (
        <StartupSnapshotModal
          isOpen={showSnapshotModal}
          onClose={() => {
            setShowSnapshotModal(false);
            setSelectedStartup(null);
          }}
          startupId={selectedStartup.startupId || selectedStartup.startup?.id}
          founderId={selectedStartup.founderId || selectedStartup.founder?.id}
        />
      )}
    </div>
  );
}
