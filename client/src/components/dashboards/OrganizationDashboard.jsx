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
import {
  Building2,
  Users,
  Plus,
  ArrowRight,
  Settings,
  LayoutGrid,
  FileText,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  getUserOrganizations,
  getOrganizationCohorts,
  isOrganizationAdmin,
  deleteCohort,
} from "../../utils/organizationHelpersBackend";
import CreateOrganizationModal from "../organizations/CreateOrganizationModal";
import CreateCohortModal from "../organizations/CreateCohortModal";
import CohortDashboardWithSidebar from "../organizations/CohortDashboardWithSidebar";
import PortfolioOverview from "../organizations/PortfolioOverview";
import ProgramMilestones from "../organizations/ProgramMilestones";
import CohortAnalyticsDashboard from "../organizations/CohortAnalyticsDashboard";
import OrganizationAgenda from "../organizations/OrganizationAgenda";

export default function OrganizationDashboard({
  user,
  onLogout,
  onUpdateUser,
}) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  const dashboardUserId = String(user._id ?? user.id ?? "");

  const [showCreateCohortModal, setShowCreateCohortModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentView, setCurrentView] = useState("home");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handler to change view and close mobile sidebar
  const handleViewChange = (view) => {
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
  };
  useEffect(() => {
    loadOrganizations();
  }, [dashboardUserId]);
  useEffect(() => {
    if (selectedOrg) {
      loadCohorts(selectedOrg.id);
      // Check admin status asynchronously
      isOrganizationAdmin(dashboardUserId, selectedOrg.id).then(setIsAdmin);
    } else {
      // Clear cohorts and admin status if no org selected
      setCohorts([]);
      setSelectedCohort(null);
      setIsAdmin(false);
    }
  }, [selectedOrg, dashboardUserId]);
  const loadOrganizations = async () => {
    try {
      const orgs = await getUserOrganizations(dashboardUserId);
      setOrganizations(orgs);

      // Auto-select first org if none selected
      if (orgs.length > 0 && !selectedOrg) {
        setSelectedOrg(orgs[0]);
      }
      // Clear selected org if it no longer exists
      else if (
        selectedOrg &&
        orgs.length > 0 &&
        !orgs.find((o) => o.id === selectedOrg.id)
      ) {
        setSelectedOrg(orgs[0]);
      }
      // Clear everything if no orgs
      else if (orgs.length === 0) {
        setSelectedOrg(null);
        setSelectedCohort(null);
        setCohorts([]);
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
      setOrganizations([]);
      setSelectedOrg(null);
      setSelectedCohort(null);
      setCohorts([]);
    }
  };
  const loadCohorts = async (orgId) => {
    try {
      const cohortsData = await getOrganizationCohorts(orgId);

      // Backend automatically cleans up stale references, so we can trust the data
      console.log(`✅ Loaded ${cohortsData.length} cohort(s)`);
      setCohorts(cohortsData);

      // Check if currently selected cohort still exists
      const currentCohortStillExists = cohortsData.some(
        (c) => c.id === selectedCohort?.id,
      );
      if (cohortsData.length > 0) {
        // Only auto-select if we already had a selected cohort that was deleted
        if (selectedCohort && !currentCohortStillExists) {
          // Current cohort was deleted, don't auto-select
          setSelectedCohort(null);
        }
        // Don't auto-select first cohort - let user choose
      } else {
        // No cohorts available
        setSelectedCohort(null);
      }
    } catch (error) {
      console.error("Failed to load cohorts:", error);
      setCohorts([]);
      setSelectedCohort(null);
    }
  };
  const handleDeleteCohort = async () => {
    if (!cohortToDelete) return;
    const cohort = cohortToDelete;
    setIsDeleting(true);
    try {
      console.log(
        "🗑️🗑️🗑️ FRONTEND: Starting cohort deletion:",
        cohort.id,
        cohort.name,
      );

      // STEP 1: Close the dialog
      setCohortToDelete(null);

      // STEP 2: Immediately remove from UI - filter out the deleted cohort
      console.log("🔄 FRONTEND: Removing cohort from UI state");
      const remainingCohorts = cohorts.filter((c) => c.id !== cohort.id);
      setCohorts(remainingCohorts);
      console.log(
        `📋 FRONTEND: Remaining cohorts in UI: ${remainingCohorts.length}`,
        remainingCohorts.map((c) => c.name),
      );

      // STEP 3: Clear selected cohort to force iframe unmount
      console.log("🔄 FRONTEND: Clearing selected cohort to unmount iframe");
      setSelectedCohort(null);

      // STEP 4: If there are remaining cohorts, select the first one after a brief delay
      if (remainingCohorts.length > 0) {
        setTimeout(() => {
          console.log(
            "✅ FRONTEND: Selecting first remaining cohort:",
            remainingCohorts[0].name,
          );
          setSelectedCohort(remainingCohorts[0]);
        }, 100);
      }

      // STEP 5: Wait for iframe to fully unmount and cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));

      // STEP 6: Delete from backend
      console.log(
        "📡 FRONTEND: Calling backend DELETE API for cohort:",
        cohort.id,
      );
      const response = await deleteCohort(cohort.id, dashboardUserId);
      console.log("✅ FRONTEND: Backend deletion response:", response);

      // STEP 7: Wait for backend to process
      await new Promise((resolve) => setTimeout(resolve, 300));

      // STEP 8: Reload cohorts from backend to confirm deletion and sync state
      console.log(
        "🔄 FRONTEND: Reloading cohorts from backend to confirm deletion",
      );
      await loadCohorts(selectedOrg.id);
      console.log("✅✅✅ FRONTEND: Cohort deletion complete");
    } catch (error) {
      console.error("❌❌❌ FRONTEND: Failed to delete cohort:", error);
      alert("Failed to delete cohort. Please try again.");

      // Reload cohorts to ensure UI is in sync
      if (selectedOrg?.id) {
        await loadCohorts(selectedOrg.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // No organizations yet
  if (organizations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-[12px] font-semibold mb-2">
              No Organization Yet
            </h2>
            <p className="text-[10px] text-muted-foreground mb-4">
              Create your organization to start managing cohorts of startups
            </p>
            <Button
              onClick={() => setShowCreateOrgModal(true)}
              className="h-7 text-[10px]"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
        <CreateOrganizationModal
          isOpen={showCreateOrgModal}
          onClose={() => setShowCreateOrgModal(false)}
          userId={dashboardUserId}
          onSuccess={() => {
            loadOrganizations();
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {selectedOrg && (
            <>
              {!selectedCohort ? (
                <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                  {currentView === "home" && (
                    <>
                      <Card>
                        <CardHeader className="pb-3 pt-4 px-4 md:px-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <CardTitle className="text-base md:text-lg">
                                  {selectedOrg.name}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {(selectedOrg.type || "accelerator").replace(
                                    "-",
                                    " ",
                                  )}
                                </Badge>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <LayoutGrid className="w-4 h-4" />
                                  <span>
                                    {cohorts.length}
                                    {" cohort"}
                                    {cohorts.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                              {selectedOrg.description && (
                                <CardDescription className="text-sm mt-1.5">
                                  {selectedOrg.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className="text-xs">
                                {isAdmin ? "Admin" : "Observer"}
                              </Badge>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {selectedOrg.website && (
                          <CardContent className="pb-4 pt-0 px-4 md:px-6">
                            <a
                              href={selectedOrg.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Visit website
                            </a>
                          </CardContent>
                        )}
                      </Card>
                      {cohorts.length === 0 ? (
                        <Card className="border-border/70 shadow-sm">
                          <CardContent className="p-6 md:p-8">
                            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-6 md:p-8">
                              <div className="mx-auto max-w-2xl text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Users className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  Launch your first cohort
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  Cohorts let you invite startups, track execution, and manage
                                  outcomes in one workspace.
                                </p>

                                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                  <Button
                                    onClick={() => setShowCreateCohortModal(true)}
                                    className="h-10 min-w-[190px] text-sm"
                                    disabled={!isAdmin}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Cohort
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="h-10 min-w-[170px] text-sm"
                                    onClick={() => setCurrentView("settings")}
                                  >
                                    Open Settings
                                  </Button>
                                </div>

                                {!isAdmin ? (
                                  <p className="mt-3 text-xs text-muted-foreground">
                                    You are currently in observer mode. Ask an organization admin
                                    to grant cohort management access.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader className="pb-4 pt-4 px-4 md:px-6">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Cohorts
                              </CardTitle>
                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCreateCohortModal(true)}
                                  className="h-9 text-sm"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  New Cohort
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pb-4 px-4 md:px-6">
                            <div className="space-y-3">
                              {cohorts.map((cohort) => (
                                <div
                                  key={cohort.id}
                                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => setSelectedCohort(cohort)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold">
                                      {cohort.name}
                                    </h4>
                                    {cohort.description && (
                                      <p className="text-sm text-muted-foreground mt-1 truncate">
                                        {cohort.description}
                                      </p>
                                    )}
                                    {cohort.startDate && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {"Started "}
                                        {new Date(
                                          cohort.startDate,
                                        ).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                    {cohort.stats && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {cohort.stats.totalStartups || 0}
                                        {" startups"}
                                      </Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 text-sm"
                                    >
                                      View
                                    </Button>
                                    {isAdmin && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger
                                          asChild={true}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          className="w-40"
                                        >
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCohortToDelete(cohort);
                                            }}
                                            className="text-sm text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Cohort
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                  {currentView === "portfolio" && selectedOrg && (
                    <PortfolioOverview organizationId={selectedOrg.id} />
                  )}
                  {currentView === "analytics" &&
                    selectedOrg &&
                    cohorts.length > 0 && (
                      <CohortAnalyticsDashboard
                        cohortId={cohorts[0].id}
                        organizationId={selectedOrg.id}
                      />
                    )}
                  {currentView === "milestones" && selectedOrg && (
                    <ProgramMilestones
                      organizationId={selectedOrg.id}
                      cohorts={cohorts}
                    />
                  )}
                  {currentView === "deliverables" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Deliverables
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Track and manage startup deliverables across all
                          cohorts
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Deliverables tracking coming soon
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {currentView === "calendar" && selectedOrg && (
                    <OrganizationAgenda organizationId={selectedOrg.id} />
                  )}
                  {currentView === "settings" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Organization Settings
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Manage your organization preferences and settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Settings interface coming soon
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <CohortDashboardWithSidebar
                  key={selectedCohort.id}
                  cohortId={selectedCohort.id}
                  organizationId={selectedOrg.id}
                  organizationName={selectedOrg.name}
                  organizationType={selectedOrg.type}
                  userId={dashboardUserId}
                  userName={user.name}
                  user={user}
                  onLogout={onLogout}
                  onUpdateUser={onUpdateUser}
                  onBack={() => setSelectedCohort(null)}
                />
              )}
            </>
          )}
        </div>
      </div>
      <CreateOrganizationModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
        userId={dashboardUserId}
        onSuccess={() => {
          loadOrganizations();
          setShowCreateOrgModal(false);
        }}
      />
      {selectedOrg && (
        <CreateCohortModal
          isOpen={showCreateCohortModal}
          onClose={() => setShowCreateCohortModal(false)}
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          userId={dashboardUserId}
          onSuccess={() => {
            loadCohorts(selectedOrg.id);
            setShowCreateCohortModal(false);
          }}
        />
      )}
      <AlertDialog
        open={!!cohortToDelete}
        onOpenChange={(open) => !open && setCohortToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Delete Cohort
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {"Are you sure you want to delete "}
              <strong>{cohortToDelete?.name}</strong>? This will remove all
              associated invitations and member data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-sm" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCohort}
              disabled={isDeleting}
              className="h-9 text-sm bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Cohort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
