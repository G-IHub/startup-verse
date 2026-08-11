import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Building2,
  Users,
  Plus,
  ArrowRight,
  Settings,
  LayoutGrid,
  Pencil,
  Trash2,
  MoreVertical,
  ArrowLeft,
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
import { checkAdminStatus } from "../../utils/api/organizationApi";
import { toastError } from "../../utils/toastError";
import CreateCohortModal from "../organizations/CreateCohortModal";
import CohortDashboardWithSidebar from "../organizations/CohortDashboardWithSidebar";
import OrganizationSettings from "../organizations/OrganizationSettings";
import {
  GradientHero,
  SectionCard,
  EmptyStateBlock,
  ListRow,
} from "../organizations/_primitives";

export default function OrganizationDashboard({
  user,
  onLogout,
  onUpdateUser,
}) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const dashboardUserId = String(user._id ?? user.id ?? "");

  const [showCreateCohortModal, setShowCreateCohortModal] = useState(false);
  // `cohortToEdit` non-null means the CreateCohortModal opens in edit mode.
  // It is mutually exclusive with `showCreateCohortModal`.
  const [cohortToEdit, setCohortToEdit] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, [dashboardUserId]);

  useEffect(() => {
    if (selectedOrg) {
      loadCohorts(selectedOrg.id);
      isOrganizationAdmin(dashboardUserId, selectedOrg.id).then(setIsAdmin);
      checkAdminStatus(selectedOrg.id, dashboardUserId).then((status) => {
        setIsCreator(Boolean(status?.isCreator));
      });
    } else {
      setCohorts([]);
      setSelectedCohort(null);
      setIsAdmin(false);
      setIsCreator(false);
      setShowOrgSettings(false);
    }
  }, [selectedOrg, dashboardUserId]);

  const loadOrganizations = async () => {
    try {
      const orgs = await getUserOrganizations(dashboardUserId);
      setOrganizations(orgs);

      if (orgs.length > 0 && !selectedOrg) {
        setSelectedOrg(orgs[0]);
      } else if (
        selectedOrg &&
        orgs.length > 0 &&
        !orgs.find((o) => o.id === selectedOrg.id)
      ) {
        setSelectedOrg(orgs[0]);
      } else if (orgs.length === 0) {
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
      setCohorts(cohortsData);

      const currentCohortStillExists = cohortsData.some(
        (c) => c.id === selectedCohort?.id,
      );
      if (cohortsData.length > 0) {
        if (selectedCohort && !currentCohortStillExists) {
          setSelectedCohort(null);
        }
      } else {
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
      setCohortToDelete(null);

      const remainingCohorts = cohorts.filter((c) => c.id !== cohort.id);
      setCohorts(remainingCohorts);
      setSelectedCohort(null);

      if (remainingCohorts.length > 0) {
        setTimeout(() => {
          setSelectedCohort(remainingCohorts[0]);
        }, 100);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      await deleteCohort(cohort.id, dashboardUserId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await loadCohorts(selectedOrg.id);
    } catch (error) {
      console.error("Failed to delete cohort:", error);
      toastError(error, "Failed to delete cohort. Please try again.");
      if (selectedOrg?.id) {
        await loadCohorts(selectedOrg.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (organizations.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center bg-surface-page p-6">
        <SectionCard className="w-full max-w-md">
          <SectionCard.Body className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-base font-bold text-text-heading">
              Organization Setup Required
            </h2>
            <p className="mt-2 font-body text-[13px] text-text-body">
              Return to organization setup to create your workspace, then create
              your first cohort.
            </p>
          </SectionCard.Body>
        </SectionCard>
      </div>
    );
  }

  const orgTypeLabel = (selectedOrg?.type || "accelerator").replace("-", " ");
  const cohortCountLabel = `${cohorts.length} cohort${cohorts.length === 1 ? "" : "s"}`;
  const orgSubtitle = selectedOrg?.description
    ? selectedOrg.description
    : `${cohortCountLabel} · Manage startups, milestones, and outcomes in one place`;

  const modals = (
    <>
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
    </>
  );

  // Cohort workspace owns the full-height shell — avoid nesting another
  // viewport chrome around it (double-frame with AppLayout / page shell).
  if (selectedOrg && selectedCohort) {
    return (
      <>
        <div className="h-screen overflow-hidden bg-surface-page">
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
        </div>
        {modals}
      </>
    );
  }

  return (
    <div className="min-h-full bg-surface-page">
      {selectedOrg && (
        <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
          {showOrgSettings ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOrgSettings(false)}
                  className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to cohorts
                </Button>
              </div>
              <OrganizationSettings
                organizationId={selectedOrg.id}
                userId={dashboardUserId}
                isCreator={isCreator}
                onUpdate={loadOrganizations}
              />
            </>
          ) : (
            <>
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
                          onClick: () => setShowOrgSettings(true),
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
                          <Plus className="mr-2 h-4 w-4" />
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
                                    <MoreVertical className="h-4 w-4" />
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
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Cohort
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCohortToDelete(cohort);
                                    }}
                                    className="font-body text-[13px] text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
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
            </>
          )}
        </div>
      )}
      {modals}
    </div>
  );
}
