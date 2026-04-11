/**
 * COHORT DASHBOARD WITH SIDEBAR NAVIGATION
 * Modern multi-page architecture with clean left sidebar
 * Mobile-responsive with hamburger menu
 */
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Menu, Plus, Download } from "lucide-react";
import OrganizationSidebar from "./OrganizationSidebar";
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
import {
  getCohort,
  getCohortMembers,
  generateCohortExport,
  downloadCSV,
} from "../../utils/organizationHelpersBackend";
import { checkAdminStatus } from "../../utils/api/organizationApi";
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
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
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

      // Map members to startup snapshots format
      const snapshotData = members.map((member) => ({
        startupId: member.founderId,
        startupName: member.startupName,
        founderName: member.founderName,
        founderEmail: member.founderEmail,
        stageName: member.founder?.stage || "Unknown",
        teamSize: 1,
        status: member.progress.activityStatus,
        executionSummary: {
          weeklyStreak: member.progress.weeklyOutcomeStreak,
          currentOutcome: member.progress.currentMilestone
            ? {
                title: member.progress.currentMilestone,
                progress: 50,
                daysLeft: 7,
              }
            : null,
          milestonesCompleted: member.progress.completedMilestones,
          tasksCompletedThisWeek: member.progress.tasksCompletedThisWeek,
        },
        lastActivity: member.progress.lastActive || member.joinedAt,
        joinedCohortAt: member.joinedAt,
      }));
      setStartups(snapshotData);

      // Update cohort stats
      const stats = {
        totalStartups: members.length,
        activeStartups: members.filter(
          (m) => m.progress.activityStatus === "active",
        ).length,
        slowingStartups: members.filter(
          (m) => m.progress.activityStatus === "slowing",
        ).length,
        stalledStartups: members.filter(
          (m) => m.progress.activityStatus === "stalled",
        ).length,
      };
      setCohort({
        ...cohortData,
        stats,
      });
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
            onInviteClick={() => setShowInviteModal(true)}
            isAdmin={isAdmin}
            organizationName={organizationName}
            organizationType={organizationType}
            onBack={onBack}
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
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold">Cohort Members</h3>
                    <p className="text-sm text-muted-foreground">
                      {startups.length}
                      {" startup"}
                      {startups.length !== 1 ? "s" : ""}
                      {" in this cohort"}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                      className="h-9 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Startup
                    </Button>
                  )}
                </div>
                {startups.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground mb-2">
                      No startups yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click "Invite Startup" to add startups to this cohort
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {startups.map((startup) => (
                      <div
                        key={startup.startupId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleViewStartup(startup)}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            {startup.startupName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {startup.founderName}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            px-3 py-1 rounded-full text-xs font-medium
                            ${startup.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : ""}
                            ${startup.status === "slowing" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" : ""}
                            ${startup.status === "stalled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : ""}
                          `}
                          >
                            {startup.status}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-sm"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
        <div className="animate-pulse text-[10px] text-muted-foreground">
          Loading cohort...
        </div>
      </div>
    );
  }
  if (error || !cohort) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-[10px] text-red-600">
            {error || "Cohort not found"}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex h-full">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4 md:p-6 flex items-center justify-between gap-4 flex-shrink-0 bg-background">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden h-9 w-9 p-0 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm md:text-base font-bold truncate">
                {cohort.name}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {cohort.description ||
                  `${cohort.stats?.totalStartups || 0} startups`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-9 text-sm flex-shrink-0"
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
                    className="h-9 text-sm"
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
                        className="h-9 text-sm hidden sm:flex"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="h-9 text-sm"
                    >
                      <Download className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
