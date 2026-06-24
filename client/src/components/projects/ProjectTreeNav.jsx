import React from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "../ui/utils";
import { useProjectStore } from "../../state/useProjectStore";
import { resolveStartupName } from "./projectUiUtils";
import { toast } from "sonner";

function idOf(row) {
  return String(row?.id || row?._id || "");
}

function StartupSectionLabel({ name, expanded, onToggle, onAdd }) {
  return (
    <div className="group flex items-center gap-0.5 py-0.5 pr-0.5">
      <button
        type="button"
        className="flex h-5 w-5 shrink-0 items-center justify-center text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
        onClick={onToggle}
        aria-label={expanded ? "Collapse startup" : "Expand startup"}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
        )}
      </button>
      <span className="min-w-0 flex-1 truncate font-body text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
        {name}
      </span>
      <button
        type="button"
        className="flex h-5 w-5 shrink-0 items-center justify-center text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#6B7280]"
        onClick={(e) => {
          e.stopPropagation();
          onAdd?.();
        }}
        aria-label="Add project"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

function ProjectSidebarRow({
  name,
  color,
  active,
  onSelect,
  onAdd,
  addLabel,
}) {
  return (
    <div className="group relative flex items-center gap-1.5 py-[5px] pl-5 pr-0.5">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "absolute inset-0 rounded-input transition-colors duration-150",
          active
            ? "bg-[#EEF2FF] shadow-[inset_2px_0_0_0_#1A56DB]"
            : "hover:bg-[#F3F4F6]",
        )}
        aria-current={active ? "page" : undefined}
      />
      <span
        className="relative z-[1] h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color || "#1A56DB" }}
        aria-hidden
      />
      <span
        className={cn(
          "relative z-[1] min-w-0 flex-1 truncate font-body text-[13px] leading-tight",
          active ? "font-medium text-[#1D4ED8]" : "text-[#374151]",
        )}
      >
        {name}
      </span>
      {onAdd ? (
        <button
          type="button"
          className="relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#6B7280]"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          aria-label={addLabel}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

function InlineNameInput({ placeholder, value, onChange, onSubmit, onCancel }) {
  return (
    <div className="py-1 pl-5 pr-0.5">
      <input
        className="w-full rounded-input border border-[#E5E7EB] bg-white px-2 py-1 font-body text-[12px] text-[#374151] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
      />
    </div>
  );
}

export default function ProjectTreeNav({
  user,
  projects,
  activeProjectSlug,
  onSelectProject,
  onAddProject,
}) {
  const createMilestone = useProjectStore((s) => s.createMilestone);
  const startupName = resolveStartupName(user);
  const [startupExpanded, setStartupExpanded] = React.useState(true);
  const [addingMilestoneFor, setAddingMilestoneFor] = React.useState(null);
  const [milestoneTitle, setMilestoneTitle] = React.useState("");

  const handleAddMilestone = async (slug) => {
    const title = milestoneTitle.trim();
    if (title.length < 2) {
      toast.error("Milestone name must be at least 2 characters");
      return;
    }
    try {
      await createMilestone(slug, { title });
      setMilestoneTitle("");
      setAddingMilestoneFor(null);
      toast.success("Milestone created");
    } catch (err) {
      toast.error(err?.message || "Could not create milestone");
    }
  };

  const isActiveProject = (slug) => activeProjectSlug === slug;

  if (!projects?.length) {
    return (
      <div className="py-3 pr-1">
        <StartupSectionLabel
          name={startupName}
          expanded={startupExpanded}
          onToggle={() => setStartupExpanded((v) => !v)}
          onAdd={onAddProject}
        />
        {startupExpanded ? (
          <p className="mt-2 pl-5 font-body text-[12px] text-[#9CA3AF]">
            No projects yet.{" "}
            <button
              type="button"
              className="text-[#6B7280] underline-offset-2 hover:underline"
              onClick={onAddProject}
            >
              Add one
            </button>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pb-2 pr-0.5">
      <StartupSectionLabel
        name={startupName}
        expanded={startupExpanded}
        onToggle={() => setStartupExpanded((v) => !v)}
        onAdd={onAddProject}
      />

      {startupExpanded ? (
        <div className="mt-0.5 space-y-px border-l border-[#E5E7EB]">
          {projects.map((project) => {
            const slug = String(project.slug || "");
            const name = String(project.name || "Untitled");
            const color = String(project.color || "#1A56DB");

            return (
              <div key={idOf(project) || slug}>
                <ProjectSidebarRow
                  name={name}
                  color={color}
                  active={isActiveProject(slug)}
                  onSelect={() => onSelectProject?.(slug)}
                  onAdd={() => setAddingMilestoneFor(slug)}
                  addLabel={`Add milestone to ${name}`}
                />
                {addingMilestoneFor === slug ? (
                  <InlineNameInput
                    placeholder="Milestone name…"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    onSubmit={() => handleAddMilestone(slug)}
                    onCancel={() => {
                      setAddingMilestoneFor(null);
                      setMilestoneTitle("");
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
