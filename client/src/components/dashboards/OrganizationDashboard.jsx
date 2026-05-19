import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Building2,
  Users,
  Plus,
  ArrowRight,
  Settings,
  LogOut,
  LayoutGrid,
  Pencil,
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
import { toastError } from "../../utils/toastError";
import CreateOrganizationModal from "../organizations/CreateOrganizationModal";
import CreateCohortModal from "../organizations/CreateCohortModal";
import CohortDashboardWithSidebar from "../organizations/CohortDashboardWithSidebar";
import {
  GradientHero,
  SectionCard,
  EmptyStateBlock,
  ListRow,
} from "../organizations/_primitives";
import { useOrgRealtime } from "../../hooks/useOrgRealtime";

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
  // `cohortToEdit` non-null means the CreateCohortModal opens in edit mode.
  // It is mutually exclusive with `showCreateCohortModal`.
  const [cohortToEdit, setCohortToEdit] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const loadCohorts = useCallback(async (orgId) => {
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
  }, [selectedCohort]);

  useOrgRealtime(selectedOrg?.id, null, {
    onCohort: () => {
      if (selectedOrg?.id) loadCohorts(selectedOrg.id);
    },
  });

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
      toastError(error, "Failed to delete cohort. Please try again.");

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
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-6">
        <SectionCard className="max-w-md w-full">
          <SectionCard.Body className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-base font-bold text-text-heading">
              No Organization Yet
            </h2>
            <p className="mt-2 font-body text-[13px] text-text-body">
              Create your organization to start managing cohorts of startups
            </p>
            <Button
              onClick={() => setShowCreateOrgModal(true)}
              className="mt-5 h-10 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
            {onLogout && (
              <Button
                type="button"
                variant="outline"
                onClick={onLogout}
                className="mt-3 h-9 rounded-input border border-surface-border font-body text-[13px] font-medium text-text-body hover:border-destructive hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            )}
          </SectionCard.Body>
        </SectionCard>
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
  const orgTypeLabel = (selectedOrg?.type || "accelerator").replace("-", " ");
  const cohortCountLabel = `${cohorts.length} cohort${cohorts.length === 1 ? "" : "s"}`;
  const orgSubtitle = selectedOrg?.description
    ? selectedOrg.description
    : `${cohortCountLabel} · Manage startups, milestones, and outcomes in one place`;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {selectedOrg && (
            <>
              {!selectedCohort ? (
                <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
                  {onLogout && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onLogout}
                        className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-destructive hover:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  )}
                  <GradientHero
                    eyebrow={orgTypeLabel.toUpperCase()}
                    title={selectedOrg.name}
                    subtitle={orgSubtitle}
                    icon={Building2}
                    actions={
                      isAdmin
                        ? [
                            {
                              label: "Settings",
                              icon: Settings,
                              variant: "glass",
                              onClick: () => {},
                            },
                          ]
                        : []
                    }
                    trailing={
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-body text-[12px] font-semibold text-white backdrop-blur-[4px]">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        {cohortCountLabel}
                      </span>
                    }
                  />
                  {selectedOrg.website && (
                    <a
                      href={selectedOrg.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-body text-[13px] font-medium text-primary hover:underline"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Visit website
                    </a>
                  )}
                  {cohorts.length === 0 ? (
                    <SectionCard>
                      <SectionCard.Body className="p-6 md:p-8">
                        <EmptyStateBlock
                          variant="centered"
                          icon={Users}
                          tone="info"
                          title="Launch your first cohort"
                          description="Cohorts let you invite startups, track execution, and manage outcomes in one workspace."
                          action={
                            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                              <Button
                                onClick={() => setShowCreateCohortModal(true)}
                                disabled={!isAdmin}
                                className="h-10 min-w-[190px] rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Cohort
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                              {!isAdmin && (
                                <p className="font-body text-[12px] text-text-muted">
                                  You are currently in observer mode. Ask an
                                  organization admin to grant cohort management
                                  access.
                                </p>
                              )}
                            </div>
                          }
                        />
                      </SectionCard.Body>
                    </SectionCard>
                  ) : (
                    <SectionCard>
                      <SectionCard.Header
                        title="Cohorts"
                        description={`${cohortCountLabel} in ${selectedOrg.name}`}
                        action={
                          isAdmin && (
                            <Button
                              size="sm"
                              onClick={() => setShowCreateCohortModal(true)}
                              className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              New Cohort
                            </Button>
                          )
                        }
                      />
                      <SectionCard.Body>
                        {cohorts.map((cohort) => (
                          <ListRow
                            key={cohort.id}
                            onClick={() => setSelectedCohort(cohort)}
                            title={cohort.name}
                            description={cohort.description || undefined}
                            meta={
                              cohort.startDate ? (
                                <span className="inline-flex items-center gap-1 font-body text-[12px] text-text-muted">
                                  {"Started "}
                                  {new Date(cohort.startDate).toLocaleDateString()}
                                </span>
                              ) : null
                            }
                            trailing={
                              <>
                                {cohort.stats && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full border-0 bg-primary-tint px-2.5 py-0.5 font-body text-[11px] font-semibold text-primary"
                                  >
                                    {cohort.stats.totalStartups || 0}
                                    {" startups"}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 rounded-input font-body text-[13px] font-medium text-primary hover:bg-primary-tint"
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
                                          setCohortToEdit(cohort);
                                        }}
                                        className="font-body text-[13px]"
                                      >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit Cohort
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCohortToDelete(cohort);
                                        }}
                                        className="font-body text-[13px] text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Cohort
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </>
                            }
                          />
                        ))}
                      </SectionCard.Body>
                    </SectionCard>
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
          isOpen={showCreateCohortModal || !!cohortToEdit}
          onClose={() => {
            setShowCreateCohortModal(false);
            setCohortToEdit(null);
          }}
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          userId={dashboardUserId}
          creatorEmail={user?.email}
          creatorName={user?.name}
          cohort={cohortToEdit}
          onSuccess={() => {
            loadCohorts(selectedOrg.id);
            setShowCreateCohortModal(false);
          }}
          onUpdated={() => {
            loadCohorts(selectedOrg.id);
            setCohortToEdit(null);
          }}
        />
      )}
      <AlertDialog
        open={!!cohortToDelete}
        onOpenChange={(open) => !open && setCohortToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
              Delete Cohort
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-[13px] text-text-body">
              {"Are you sure you want to delete "}
              <strong>{cohortToDelete?.name}</strong>? This will remove all
              associated invitations and member data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-9 rounded-input font-body text-[13px] font-medium"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCohort}
              disabled={isDeleting}
              className="h-9 rounded-input bg-destructive font-body text-[13px] font-semibold text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Cohort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
