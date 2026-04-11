import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Users,
  Plus,
  Download,
  Eye,
  TrendingUp,
  AlertTriangle,
  XCircle,
  BarChart3,
  Target,
  Activity,
  FileText,
  BookOpen,
  Calendar,
  UserPlus,
  Bell,
} from "lucide-react";
import {
  getCohort,
  getCohortMembers,
  generateCohortExport,
  downloadCSV,
} from "../../utils/organizationHelpersBackend";
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
export default function CohortDashboard({
  cohortId,
  organizationId,
  organizationName,
  userId,
}) {
  const [cohort, setCohort] = useState(null);
  const [startups, setStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    // Reset state when cohortId changes
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
        return;
      }
      setCohort(cohortData);

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
        // Will be updated with real data
        status: member.progress.activityStatus,
        executionSummary: {
          weeklyStreak: member.progress.weeklyOutcomeStreak,
          currentOutcome: member.progress.currentMilestone
            ? {
                title: member.progress.currentMilestone,
                progress: 50,
                // Placeholder
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

      // Update cohort stats based on real data
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
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700";
      case "slowing":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700";
      case "stalled":
        return "text-red-600 bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-950 border-gray-300 dark:border-gray-700";
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <TrendingUp className="w-3 h-3" />;
      case "slowing":
        return <AlertTriangle className="w-3 h-3" />;
      case "stalled":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };
  if (loading) {
    return <div className="text-[10px] text-muted-foreground">Loading...</div>;
  }
  if (error) {
    return <div className="text-[10px] text-red-600">{error}</div>;
  }
  if (!cohort) {
    return <div className="text-[10px] text-muted-foreground">Loading...</div>;
  }
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[10px] flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {cohort.name}
              </CardTitle>
              <CardDescription className="text-[9px] mt-0.5">
                {organizationName}
                {cohort.startDate && (
                  <>
                    {" • Started "}
                    {new Date(cohort.startDate).toLocaleDateString()}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-6 text-[9px]"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="h-6 text-[9px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Invite Startup
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-muted/30 rounded-lg border">
              <p className="text-[8px] text-muted-foreground uppercase">
                Total
              </p>
              <p className="text-[14px] font-bold">
                {cohort.stats?.totalStartups || 0}
              </p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-[8px] text-green-700 dark:text-green-400 uppercase">
                Active
              </p>
              <p className="text-[14px] font-bold text-green-700 dark:text-green-400">
                {cohort.stats?.activeStartups || 0}
              </p>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-[8px] text-yellow-700 dark:text-yellow-400 uppercase">
                Slowing
              </p>
              <p className="text-[14px] font-bold text-yellow-700 dark:text-yellow-400">
                {cohort.stats?.slowingStartups || 0}
              </p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-[8px] text-red-700 dark:text-red-400 uppercase">
                Stalled
              </p>
              <p className="text-[14px] font-bold text-red-700 dark:text-red-400">
                {cohort.stats?.stalledStartups || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="h-7 w-full grid grid-cols-9">
          <TabsTrigger value="portfolio" className="text-[9px] h-6">
            <Activity className="w-3 h-3 mr-1" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="milestones" className="text-[9px] h-6">
            <Target className="w-3 h-3 mr-1" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="text-[9px] h-6">
            <FileText className="w-3 h-3 mr-1" />
            Deliverables
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-[9px] h-6">
            <BookOpen className="w-3 h-3 mr-1" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="events" className="text-[9px] h-6">
            <Calendar className="w-3 h-3 mr-1" />
            Events
          </TabsTrigger>
          <TabsTrigger value="mentors" className="text-[9px] h-6">
            <UserPlus className="w-3 h-3 mr-1" />
            Mentors
          </TabsTrigger>
          <TabsTrigger value="communication" className="text-[9px] h-6">
            <Bell className="w-3 h-3 mr-1" />
            Comms
          </TabsTrigger>
          <TabsTrigger value="members" className="text-[9px] h-6">
            <Users className="w-3 h-3 mr-1" />
            Members
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-[9px] h-6">
            <BarChart3 className="w-3 h-3 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio" className="mt-3">
          <PortfolioOverview
            cohortId={cohortId}
            onViewStartup={(founderId) => {
              const startup = startups.find((s) => s.startupId === founderId);
              if (startup) handleViewStartup(startup);
            }}
          />
        </TabsContent>
        <TabsContent value="milestones" className="mt-3">
          <ProgramMilestones
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={true}
          />
        </TabsContent>
        <TabsContent value="deliverables" className="mt-3">
          <DeliverablesManager
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={true}
          />
        </TabsContent>
        <TabsContent value="resources" className="mt-3">
          <ResourceLibrary
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={true}
          />
        </TabsContent>
        <TabsContent value="events" className="mt-3">
          <EventManager
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            isAdmin={true}
          />
        </TabsContent>
        <TabsContent value="mentors" className="mt-3">
          <MentorNetwork
            organizationId={organizationId}
            userId={userId}
            isAdmin={true}
          />
        </TabsContent>
        <TabsContent value="communication" className="mt-3">
          <CommunicationCenter
            cohortId={cohortId}
            organizationId={organizationId}
            userId={userId}
            userName="Admin User"
            isAdmin={true}
            cohortMembers={startups.map((s) => ({
              founderId: s.startupId,
              founderName: s.founderName,
              startupName: s.startupName,
            }))}
          />
        </TabsContent>
        <TabsContent value="members" className="mt-3">
          <Card>
            <CardHeader className="pb-2 pt-3 border-b">
              <CardTitle className="text-[10px]">
                Startups ({startups.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {startups.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground mb-1">
                    No startups yet
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    Click "Invite Startup" to add startups to this cohort
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {startups.map((startup) => (
                    <div
                      key={startup.startupId}
                      className="p-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleViewStartup(startup)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-[10px] truncate">
                              {startup.startupName}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`text-[8px] px-1.5 py-0 ${getStatusColor(startup.status)}`}
                            >
                              {getStatusIcon(startup.status)}
                              <span className="ml-1 capitalize">
                                {startup.status}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                            <span>{startup.founderName}</span>
                            <span>•</span>
                            <span>{startup.stageName}</span>
                            <span>•</span>
                            <span>
                              {startup.teamSize}
                              {" member"}
                              {startup.teamSize !== 1 ? "s" : ""}
                            </span>
                            {startup.executionSummary.weeklyStreak > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-medium">
                                  {"🔥 "}
                                  {startup.executionSummary.weeklyStreak}
                                  {" week streak"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[9px] flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStartup(startup);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                      {startup.executionSummary.currentOutcome && (
                        <div className="mt-1.5 p-1.5 bg-muted/50 rounded border">
                          <p className="text-[9px] text-muted-foreground mb-0.5">
                            Current Focus:
                          </p>
                          <p className="text-[9px] font-medium">
                            {startup.executionSummary.currentOutcome.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${startup.executionSummary.currentOutcome.progress}%`,
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-muted-foreground">
                              {startup.executionSummary.currentOutcome.progress}
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="mt-3">
          <CohortAnalyticsDashboard cohortId={cohortId} />
        </TabsContent>
      </Tabs>
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
