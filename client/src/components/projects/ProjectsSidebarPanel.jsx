import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useProjectStore } from "../../state/useProjectStore";
import { resolveFounderId } from "./projectUiUtils";
import ProjectTreeNav from "./ProjectTreeNav";
import CreateProjectModal from "./CreateProjectModal";

export default function ProjectsSidebarPanel({
  user,
  onNavigate,
  projectSlug,
  milestoneId,
  projectTaskId,
  createProjectOpen,
  onCreateProjectOpenChange,
}) {
  const founderId = useMemo(() => resolveFounderId(user), [user]);

  const projects = useProjectStore((s) => s.projects);
  const loading = useProjectStore((s) => s.loading);
  const setFounderId = useProjectStore((s) => s.setFounderId);
  const load = useProjectStore((s) => s.load);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  useEffect(() => {
    if (!founderId) return;
    setFounderId(founderId);
    load(founderId).catch(() => {});
  }, [founderId, setFounderId, load]);

  useEffect(() => {
    if (!founderId || !projectSlug) return;
    setActiveProject(projectSlug, { silent: true }).catch(() => {});
  }, [founderId, projectSlug, setActiveProject]);

  const navigateSelection = useCallback(
    (next) => {
      onNavigate?.("projects-workspace", {
        ...(next.projectSlug !== undefined ? { projectSlug: next.projectSlug } : {}),
        ...(next.milestoneId !== undefined ? { milestoneId: next.milestoneId } : {}),
        ...(next.projectTaskId !== undefined
          ? { projectTaskId: next.projectTaskId }
          : {}),
      });
    },
    [onNavigate],
  );

  const handleProjectCreated = useCallback(
    async (created) => {
      const slug = String(created?.slug || "");
      if (slug) {
        navigateSelection({
          projectSlug: slug,
          milestoneId: null,
          projectTaskId: null,
        });
      }
    },
    [navigateSelection],
  );

  if (!founderId) {
    return (
      <p className="mt-2 pl-3 font-body text-[11px] text-[#9CA3AF]">
        Projects are available to founders and team members.
      </p>
    );
  }

  return (
    <>
      <div className="mt-2 ml-3 border-l border-[#E5E7EB] pl-2">
        {loading && !projects?.length ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
          </div>
        ) : (
          <ProjectTreeNav
            user={user}
            projects={projects}
            activeProjectSlug={projectSlug}
            onSelectProject={(slug) =>
              navigateSelection({
                projectSlug: slug,
                milestoneId: null,
                projectTaskId: null,
              })
            }
            onAddProject={() => onCreateProjectOpenChange?.(true)}
          />
        )}
      </div>

      <CreateProjectModal
        open={Boolean(createProjectOpen)}
        onOpenChange={onCreateProjectOpenChange}
        founderId={founderId}
        onCreated={handleProjectCreated}
      />
    </>
  );
}
