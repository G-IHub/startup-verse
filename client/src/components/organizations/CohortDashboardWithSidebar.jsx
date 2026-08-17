/**
 * COHORT DASHBOARD WITH SIDEBAR NAVIGATION
 * Modern multi-page architecture with clean left sidebar
 * Mobile-responsive with hamburger menu
 */
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Menu, Plus, Download, Rocket, ChevronRight } from "lucide-react";
import OrganizationSidebar from "./OrganizationSidebar";
import {
  SectionCard,
  ListRow,
  StatusBadge,
  EmptyStateBlock,
} from "./_primitives";
import CohortHomePage from "./CohortHomePage";
import InviteStartupModal from "./InviteStartupModal";
import AvailableStartupsPanel from "./AvailableStartupsPanel";
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
import {
  getCohort,
  getCohortMembers,
  generateCohortExport,
  downloadCSV,
  updateCohort,
} from "../../utils/organizationHelpersBackend";
import { checkAdminStatus } from "../../utils/api/organizationApi";
import ProgramJoinRequestsPanel from "./ProgramJoinRequestsPanel";
import ProgramNotesPanel from "../program/ProgramNotesPanel";
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
  const [startups, setStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalMode, setInviteModalMode] = useState("browse");
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);
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

      // Get all startups in this cohort with real backend data
      const members = await getCohortMembers(cohortId);

      const snapshotData = members.map((m) => ({
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
            ? {
                title: m.progress.currentMilestone,
                progress: 50,
                daysLeft: 7,
              }
            : null,
          milestonesCompleted: m.progress?.completedMilestones ?? 0,
          tasksCompletedThisWeek: m.progress?.tasksCompletedThisWeek ?? 0,
        },
        lastActivity: m.progress?.lastActive || m.joinedAt,
        joinedCohortAt: m.joinedAt,
      }));
      setStartups(snapshotData);
    } catch (error) {
      console.error("Failed to load cohort data:", error);
      setError("Failed to load cohort data");
    } finally {
      setLoading(false);
    }
  };
  const handleExport = async () => {
    const exportData = await generateCohortExport(cohortId);
    if (exportData) {
      const filename = `${cohort?.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;
      downloadCSV(exportData, filename);
    }
  };
  const handleViewStartup = (startup) => {
    setSelectedStartup(startup);
    setShowSnapshotModal(true);
  };
  const renderPageContent = () => {
    if (!cohort) return null;
    switch (currentPage) {
      case "home":
        return (
          <CohortHomePage
            cohort={cohort}
            onNavigate={setCurrentPage}
            onInviteClick={() => {
              setInviteModalMode("browse");
              setShowInviteModal(true);
            }}
            isAdmin={isAdmin}
            organizationName={organizationName}
            organizationType={organizationType}
            userName={userName}
            onBack={onBack}
            listingBusy={listingBusy}
            onListedChange={async (listed) => {
              setListingBusy(true);
              try {
                const updated = await updateCohort(cohortId, { listed });
                setCohort((prev) => ({ ...(prev || {}), ...updated, listed }));
              } catch (err) {
                console.error("Failed to update listing:", err);
              } finally {
                setListingBusy(false);
              }
            }}
          />
        );
      case "portfolio":
        return (
          <PortfolioOverview
            cohortId={cohortId}
            onViewStartup={(founderId) => {
              const startup = startups.find((s) => s.startupId === founderId);
              if (startup) handleViewStartup(startup);
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
            cohortMembers={startups.map((s) => ({
              founderId: s.startupId,
              founderName: s.founderName,
              startupName: s.startupName,
            }))}
          />
        );
      case "notes":
        return <ProgramNotesPanel cohortId={cohortId} />;
      case "join-requests":
        return (
          <ProgramJoinRequestsPanel
            organizationId={organizationId}
            cohortId={cohortId}
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
          <SectionCard>
            <SectionCard.Header
              title="Cohort Members"
              description={`${startups.length} startup${startups.length !== 1 ? "s" : ""} in this cohort`}
              action={
                isAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setInviteModalMode("browse");
                      setShowInviteModal(true);
                    }}
                    className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] hover:bg-primary-hover"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Startup
                  </Button>
                ) : null
              }
            />
            <SectionCard.Body>
              {startups.length === 0 ? (
                isAdmin ? (
                  <AvailableStartupsPanel
                    cohortId={cohortId}
                    cohortName={cohort?.name}
                    organizationId={organizationId}
                    userId={userId}
                    onInviteSuccess={loadData}
                    onInviteByEmail={() => {
                      setInviteModalMode("email");
                      setShowInviteModal(true);
                    }}
                  />
                ) : (
                  <EmptyStateBlock
                    variant="centered"
                    icon={Rocket}
                    tone="info"
                    title="No startups yet"
                    description="This cohort has no startup members."
                  />
                )
              ) : (
                <div className="space-y-2">
                  {startups.map((startup) => (
                    <ListRow
                      key={startup.startupId}
                      onClick={() => handleViewStartup(startup)}
                      leading={
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-heading text-[13px] font-bold text-primary">
                          {(startup.startupName || "?")
                            .charAt(0)
                            .toUpperCase()}
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
      notes: "Program notes",
      "join-requests": "Join requests",
      mentors: "Mentor Network",
      resources: "Resource Library",
      members: "Cohort Members",
      settings: "Settings",
    };
    return titles[currentPage];
  };
  const getPageDescription = () => {
    const descriptions = {
      home: cohort.description || `${cohort.stats?.totalStartups || 0} startups`,
      portfolio: "Track startup health and cohort progress",
      analytics: "Review cohort execution trends and insights",
      milestones: "Manage program milestones and founder progress",
      deliverables: "Review required submissions and startup work",
      events: "Coordinate cohort events and meetings",
      communication: "Send announcements and messages",
      notes: "Share one notes thread with enrolled startups",
      "join-requests": "Accept or decline founder requests to join",
      mentors: "Manage mentors and founder assignments",
      resources: "Curate learning materials and program resources",
      members: "Review founders and startups in this cohort",
      settings: "Configure cohort and organization controls",
    };
    return descriptions[currentPage] || cohort.name;
  };
  if (loading) {
    return (
      <div
        className="flex h-full bg-surface-page"
        aria-busy="true"
        aria-label="Loading cohort"
      >
        <div className="hidden w-[216px] shrink-0 animate-pulse border-r border-surface-border bg-surface-card md:block">
          <div className="space-y-3 p-4">
            <div className="h-4 w-28 rounded bg-surface-border/50" />
            <div className="h-3 w-20 rounded bg-surface-border/40" />
            <div className="mt-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-full rounded-input bg-surface-border/40"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-[64px] items-center gap-3 border-b border-surface-border bg-surface-card px-4 py-3 md:px-6">
            <div className="h-5 w-40 animate-pulse rounded bg-surface-border/50" />
          </div>
          <div className="flex-1 space-y-3 p-4 md:p-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-card border border-surface-border bg-surface-card"
                />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-card border border-surface-border bg-surface-card" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !cohort) {
    return (
      <SectionCard className="m-4 md:m-6">
        <SectionCard.Body className="p-0">
          <EmptyStateBlock
            variant="centered"
            icon={Rocket}
            tone="danger"
            title={error || "Cohort not found"}
            description="Return to your organization home and try again."
            action={
              onBack ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
                >
                  ← Back to cohorts
                </Button>
              ) : null
            }
          />
        </SectionCard.Body>
      </SectionCard>
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
        onLogout={onLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-[64px] flex-shrink-0 items-center justify-between gap-4 border-b border-surface-border bg-surface-card px-4 py-3 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="h-9 w-9 flex-shrink-0 p-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-base font-bold leading-tight text-text-heading sm:text-lg">
                {getPageTitle()}
              </h2>
              <p className="hidden truncate font-body text-xs leading-snug text-text-muted sm:block">
                {getPageDescription()}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
              >
                ← Back to cohorts
              </Button>
            )}
            {isAdmin && (
              <>
                {currentPage === "home" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setInviteModalMode("browse");
                      setShowInviteModal(true);
                    }}
                    className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] hover:bg-primary-hover"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Startup
                  </Button>
                )}
                {currentPage !== "home" && (
                  <>
                    {currentPage === "members" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInviteModalMode("browse");
                          setShowInviteModal(true);
                        }}
                        className="hidden h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary sm:flex"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Invite
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
                    >
                      <Download className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-surface-page p-4 md:p-6">
          {renderPageContent()}
        </div>
      </div>
      <InviteStartupModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        initialMode={inviteModalMode}
        cohortId={cohortId}
        cohortName={cohort.name}
        organizationId={organizationId}
        organizationName={organizationName}
        userId={userId}
        onSuccess={loadData}
      />
      {selectedStartup && (
        <StartupSnapshotModal
          isOpen={showSnapshotModal}
          onClose={() => {
            setShowSnapshotModal(false);
            setSelectedStartup(null);
          }}
          startup={selectedStartup}
        />
      )}
    </div>
  );
}
