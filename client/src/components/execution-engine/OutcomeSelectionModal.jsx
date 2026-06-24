import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Target,
  CheckCircle2,
  Edit3,
  Sparkles,
  ChevronRight,
  X,
  Lightbulb,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { getOutcomeTemplatesForStage } from "../../utils/executionEngine";
import MilestoneTaskFieldList, {
  TaskPillPreview,
} from "./MilestoneTaskFieldList.jsx";

function seedCustomMilestoneDrafts(title, description) {
  const lines = String(description || "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const tasks = lines.length > 0 ? lines : [""];
  return [{ title: String(title || "").trim(), tasks }];
}

export default function OutcomeSelectionModal({
  isOpen,
  onClose,
  currentStage,
  stageName,
  weekNumber,
  onSelectOutcome,
  onOpenIntentCapture,
  projects = [],
  selectedProjectId,
  onSelectedProjectIdChange,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [reviewMilestones, setReviewMilestones] = useState([]);
  const [customMilestoneDrafts, setCustomMilestoneDrafts] = useState([]);
  const [step, setStep] = useState("project");

  useEffect(() => {
    if (!isOpen) return;
    setStep("project");
    setSelectedTemplateId(null);
    setCustomMode(false);
    setCustomTitle("");
    setCustomDescription("");
    setReviewMilestones([]);
    setCustomMilestoneDrafts([]);
    onSelectedProjectIdChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [isOpen]);

  if (!isOpen) return null;
  const templates = getOutcomeTemplatesForStage(currentStage);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const handleSelectTemplate = (templateId) => {
    const t = templates.find((x) => x.id === templateId);
    setSelectedTemplateId(templateId);
    if (t?.defaultMilestones?.length) {
      setReviewMilestones(
        t.defaultMilestones.map((m) => {
          const rowTasks = (m.defaultTasks || [])
            .map((dt) => String(dt || "").trim())
            .filter(Boolean);
          return {
            title: String(m.title || ""),
            tasks: rowTasks.length > 0 ? rowTasks : [""],
          };
        }),
      );
    } else {
      setReviewMilestones([]);
    }
    setStep("review");
  };
  const handleConfirmOutcome = async () => {
    if (!selectedTemplateId) return;
    const customMilestones =
      selectedTemplate?.defaultMilestones?.length && reviewMilestones.length
        ? reviewMilestones.map((draft, idx) => {
            const orig = selectedTemplate.defaultMilestones[idx];
            const lines = (Array.isArray(draft.tasks) ? draft.tasks : [])
              .map((s) => String(s || "").trim())
              .filter(Boolean);
            return {
              title:
                draft.title.trim() ||
                String(orig?.title || "").trim() ||
                `Milestone ${idx + 1}`,
              tasks:
                lines.length > 0 ? lines : [...(orig?.defaultTasks || [])],
            };
          })
        : undefined;
    try {
      await onSelectOutcome(
        selectedTemplateId,
        customMode ? customTitle : undefined,
        customMode ? customDescription : undefined,
        customMilestones,
        selectedProjectId || null,
      );
    } catch {
      /* parent toasts and may re-open modal */
    }
  };
  const handleCustomOutcome = () => {
    setCustomMode(true);
    setCustomMilestoneDrafts([]);
    setStep("custom");
  };

  const handleCustomDetailsNext = () => {
    setCustomMilestoneDrafts((prev) =>
      prev.length === 0
        ? seedCustomMilestoneDrafts(customTitle, customDescription)
        : prev,
    );
    setStep("custom-milestones");
  };

  const handleConfirmCustomOutcome = async () => {
    const payload = customMilestoneDrafts.map((draft, idx) => ({
      title:
        draft.title.trim() ||
        customTitle.trim() ||
        `Milestone ${idx + 1}`,
      tasks: (Array.isArray(draft.tasks) ? draft.tasks : [])
        .map((t) => String(t || "").trim())
        .filter(Boolean),
    }));
    try {
      await onSelectOutcome(
        "custom",
        customTitle,
        customDescription,
        payload,
        selectedProjectId || null,
      );
    } catch {
      /* parent toasts */
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border-0 shadow-modal">
        <CardHeader className="border-b border-primary/12 bg-[color-mix(in_srgb,var(--primary-tint)_42%,white)] px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-[10px] flex items-center gap-1.5 text-card-foreground font-semibold tracking-tight">
                <Target className="w-3.5 h-3.5 shrink-0 text-primary" />
                Select Your Weekly Outcome
              </CardTitle>
              <CardDescription className="mt-1 text-[9px] text-text-muted">
                {step === "project" ? (
                  <>Step 1 of 3 — Choose a project</>
                ) : step === "custom-milestones" ? (
                  <>
                    {"Week "}
                    {weekNumber}
                    {" • "}
                    {stageName}
                    {" • Step 2 — Milestones & tasks"}
                  </>
                ) : step === "custom" ? (
                  <>
                    {"Week "}
                    {weekNumber}
                    {" • "}
                    {stageName}
                    {" • Step 1 — Outcome details"}
                  </>
                ) : (
                  <>
                    {"Week "}
                    {weekNumber}
                    {" • "}
                    {stageName}
                  </>
                )}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 pt-4 sm:px-6">
          {step === "project" && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-card-foreground">
                  Which project is this week&apos;s work for?
                </h3>
                <p className="text-xs text-text-muted">
                  Link your weekly goal to a project, or continue with general work.
                </p>
              </div>
              <div className="space-y-2">
                {(projects || []).map((p) => {
                  const pid = String(p.id || p.raw?.id || p.raw?._id || "");
                  const checked = selectedProjectId === pid;
                  const pending =
                    Number(p.totalTasks || 0) - Number(p.completedTasks || 0);
                  return (
                    <label
                      key={pid || p.slug}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/15 p-3 transition-colors hover:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="weekly-project"
                        checked={checked}
                        onChange={() => onSelectedProjectIdChange?.(pid)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-card-foreground">
                          {p.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {pending > 0 ? `${pending} tasks pending` : "No pending tasks"}
                        </p>
                      </div>
                    </label>
                  );
                })}
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/15 p-3 transition-colors hover:bg-primary/5">
                  <input
                    type="radio"
                    name="weekly-project"
                    checked={!selectedProjectId}
                    onChange={() => onSelectedProjectIdChange?.(null)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      + No project (general work)
                    </p>
                    <p className="text-xs text-text-muted">
                      Weekly plan won&apos;t be linked to a specific project.
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={() => setStep("select")}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {step === "select" && (
            <>
              {onOpenIntentCapture && (
                <button
                  type="button"
                  aria-label="Describe in Your Own Words"
                  onClick={() => {
                    onOpenIntentCapture();
                  }}
                  className="group w-full cursor-pointer rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-card to-purple-50/80 p-3.5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <h3 className="text-[10px] font-semibold text-card-foreground">
                          Describe in Your Own Words
                        </h3>
                        <Badge className="border-transparent bg-primary text-[8px] px-1.5 py-0 h-4">
                          Recommended
                        </Badge>
                      </div>
                      <p className="mb-2.5 text-[10px] leading-relaxed text-text-body">
                        Tell us what you want to accomplish this week in plain
                        English. Our algorithm will translate it into a
                        structured outcome with milestones and tasks.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary transition-all group-hover:gap-2">
                        <Sparkles className="w-3 h-3" />
                        <span>Try the smart way</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </button>
              )}
              <div className="relative py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/12" />
                </div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-wider">
                  <span className="bg-card px-3 font-medium text-text-muted">
                    Or choose a template
                  </span>
                </div>
              </div>
              <div>
                <h3 className="mb-1 text-[10px] font-semibold text-card-foreground tracking-tight">
                  {"Recommended Outcomes for "}
                  {stageName}
                </h3>
                <p className="mb-2 text-[10px] leading-relaxed text-text-body">
                  Choose one focused outcome to achieve this week. These are
                  proven outcomes for startups at your stage.
                </p>
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="group cursor-pointer rounded-xl border border-primary/15 bg-card p-3 shadow-sm transition-all hover:border-primary/35 hover:bg-primary/[0.03] hover:shadow"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="mb-1 font-semibold text-[10px] group-hover:text-primary">
                          {template.title}
                        </h4>
                        <p className="mb-2 text-[10px] leading-relaxed text-text-body">
                          {template.description}
                        </p>
                        <div className="mb-2 flex items-center gap-1.5 text-[9px] text-text-muted">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span>
                            {template.defaultMilestones.length}
                            {" milestones"}
                          </span>
                        </div>
                        <div className="border-t border-primary/10 pt-2">
                          <p className="mb-1.5 text-[8px] font-medium uppercase tracking-wide text-text-muted">
                            Tasks by milestone
                          </p>
                          <div className="space-y-2">
                            {template.defaultMilestones.slice(0, 3).map(
                              (ms, mi) => {
                                const rawTasks = ms.defaultTasks || [];
                                const shown = rawTasks.slice(0, 7);
                                const more = rawTasks.length - shown.length;
                                return (
                                  <div key={mi} className="space-y-1">
                                    <p className="text-[9px] font-semibold text-card-foreground">
                                      {ms.title}
                                    </p>
                                    <div className="flex flex-col gap-1">
                                      {shown.map((t, ti) => (
                                        <TaskPillPreview
                                          key={ti}
                                          index={ti + 1}
                                          text={String(t)}
                                          compact
                                        />
                                      ))}
                                      {more > 0 ? (
                                        <p className="pl-1 text-[8px] text-text-muted">
                                          +{more} more in this milestone…
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                          {template.defaultMilestones.length > 3 ? (
                            <p className="mt-1.5 text-[8px] text-text-muted">
                              +
                              {template.defaultMilestones.length - 3}
                              {" more milestones — tap to edit all"}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-[8px] text-text-muted">
                              Tap card to edit milestones & tasks
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-primary" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/12 pt-3">
                <Button
                  variant="outline"
                  className="h-9 w-full rounded-[10px] text-[10px]"
                  onClick={handleCustomOutcome}
                >
                  <Edit3 className="w-3 h-3 mr-1.5" />
                  Create Custom Outcome
                </Button>
              </div>
            </>
          )}
          {step === "review" && selectedTemplate && (
            <>
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                <div className="flex items-start gap-2 mb-2.5">
                  <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {customMode ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-[10px]">Outcome Title</Label>
                          <Input
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Enter your weekly outcome..."
                            className="mt-1 h-7 text-[10px]"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Description</Label>
                          <Textarea
                            value={customDescription}
                            onChange={(e) =>
                              setCustomDescription(e.target.value)
                            }
                            placeholder="Describe what success looks like..."
                            className="mt-1 text-[10px] min-h-[60px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-[10px] font-semibold mb-1">
                          {selectedTemplate.title}
                        </h3>
                        <p className="text-[10px] leading-relaxed text-text-body">
                          {selectedTemplate.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {!customMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[9px]"
                    onClick={() => {
                      setCustomMode(true);
                      setCustomTitle(selectedTemplate.title);
                      setCustomDescription(selectedTemplate.description);
                    }}
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Customize This Outcome
                  </Button>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1.5 text-[10px]">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Milestones ({reviewMilestones.length || selectedTemplate.defaultMilestones.length})
                </h4>
                <p className="text-[9px] text-text-muted mb-2 leading-relaxed">
                  Edit titles and tasks before saving.
                </p>
                <div className="space-y-2">
                  {reviewMilestones.map((draft, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-primary/20 bg-card p-2 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div>
                            <Label className="text-[9px] text-text-muted">
                              Milestone title
                            </Label>
                            <Input
                              value={draft.title}
                              onChange={(e) => {
                                const v = e.target.value;
                                setReviewMilestones((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, title: v } : d,
                                  ),
                                );
                              }}
                              className="mt-0.5 h-7 text-[10px]"
                            />
                          </div>
                          <MilestoneTaskFieldList
                            tasks={draft.tasks}
                            hint=""
                            labelClassName="text-[9px] text-text-muted"
                            rowClassName="flex items-center gap-1.5 rounded-full border border-primary/22 bg-primary/[0.05] py-0.5 pl-1 pr-0.5 shadow-sm"
                            badgeClassName="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold tabular-nums text-primary"
                            inputClassName="h-7 flex-1 min-w-0 border-0 bg-transparent px-1.5 text-[10px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            removeButtonClassName="h-7 w-7 shrink-0 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            addTaskButtonClassName="h-7 rounded-full border-primary/25 text-[10px] text-primary hover:bg-primary/[0.06]"
                            onChange={(next) =>
                              setReviewMilestones((prev) =>
                                prev.map((d, i) =>
                                  i === index ? { ...d, tasks: next } : d,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 border-t border-primary/12 pt-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select");
                    setSelectedTemplateId(null);
                    setCustomMode(false);
                  }}
                  className="h-9 flex-1 rounded-[10px] text-[10px]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmOutcome}
                  disabled={
                    customMode &&
                    (!customTitle.trim() || !customDescription.trim())
                  }
                  className="h-9 flex-1 rounded-[10px] text-[10px]"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Set This Week's Outcome
                </Button>
              </div>
            </>
          )}
          {step === "custom" && (
            <>
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-purple-50/50 p-3.5 shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10">
                      <Lightbulb className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-[10px] font-semibold tracking-tight text-card-foreground">
                        Creating a custom outcome
                      </p>
                      <p className="text-[10px] leading-relaxed text-text-body">
                        Start with a clear title and description. On the next
                        step you&apos;ll add milestones and tasks—the same
                        layout as when you pick a recommended template.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-primary/12 bg-card p-4 shadow-sm">
                  <div className="border-b border-primary/10 pb-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      Outcome details
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-text-body">
                      Use a concrete title and a short description so your team
                      shares the same definition of success.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sv-custom-outcome-title"
                        className="text-[10px] font-medium text-text-body"
                      >
                        Outcome title{" "}
                        <span className="text-primary font-semibold">*</span>
                      </Label>
                      <Input
                        id="sv-custom-outcome-title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Validate pricing with 10 customer interviews"
                        className="h-9 rounded-[10px] text-[10px]"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sv-custom-outcome-description"
                        className="text-[10px] font-medium text-text-body"
                      >
                        Description{" "}
                        <span className="text-primary font-semibold">*</span>
                      </Label>
                      <Textarea
                        id="sv-custom-outcome-description"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="What does success look like this week? Mention numbers, deliverables, or decisions you need."
                        className="min-h-[96px] resize-y rounded-[10px] text-[10px] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
                  <Lightbulb
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <p className="text-[10px] leading-relaxed text-text-body">
                    <span className="font-semibold text-card-foreground">
                      Tip:
                    </span>{" "}
                    Strong outcomes are specific and doable in one week. Use
                    Next when you&apos;re ready to break this into milestones and
                    tasks.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-primary/12 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("select");
                    setCustomMode(false);
                    setCustomTitle("");
                    setCustomDescription("");
                    setCustomMilestoneDrafts([]);
                  }}
                  className="h-9 flex-1 rounded-[10px] border-primary/22 text-[10px] text-card-foreground hover:bg-primary/[0.05]"
                >
                  Back to Templates
                </Button>
                <Button
                  type="button"
                  onClick={handleCustomDetailsNext}
                  disabled={!customTitle.trim() || !customDescription.trim()}
                  className="h-9 flex-1 rounded-[10px] text-[10px] shadow-sm"
                >
                  Next
                  <ChevronRight className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            </>
          )}
          {step === "custom-milestones" && (
            <>
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-purple-50/50 p-3.5 shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10">
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-[10px] font-semibold tracking-tight text-card-foreground">
                        Milestones & tasks
                      </p>
                      <p className="text-[10px] leading-relaxed text-text-body">
                        Each milestone is a checkpoint; add tasks as concrete
                        steps. This matches the editor used for recommended
                        templates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                  <div className="flex items-start gap-2">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="text-[10px] font-semibold text-card-foreground">
                        {customTitle.trim() || "Your outcome"}
                      </h3>
                      <p className="text-[10px] leading-relaxed text-text-body">
                        {customDescription.trim()}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[9px] text-primary"
                        onClick={() => setStep("custom")}
                      >
                        <Edit3 className="mr-1 h-3 w-3" />
                        Edit outcome details
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Milestones ({customMilestoneDrafts.length})
                  </h4>
                  <p className="mb-2 text-[9px] leading-relaxed text-text-muted">
                    Edit titles and tasks before saving.
                  </p>
                  <div className="space-y-2">
                    {customMilestoneDrafts.map((draft, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-primary/20 bg-card p-2 shadow-sm"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <Label className="text-[9px] text-text-muted">
                                  Milestone title
                                </Label>
                                <Input
                                  value={draft.title}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setCustomMilestoneDrafts((prev) =>
                                      prev.map((d, i) =>
                                        i === index ? { ...d, title: v } : d,
                                      ),
                                    );
                                  }}
                                  className="h-7 text-[10px]"
                                  placeholder="Milestone title"
                                />
                              </div>
                              {customMilestoneDrafts.length > 1 ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 shrink-0 self-start rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label={`Remove milestone ${index + 1}`}
                                  onClick={() =>
                                    setCustomMilestoneDrafts((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    )
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </div>
                            <MilestoneTaskFieldList
                              tasks={draft.tasks}
                              hint=""
                              labelClassName="text-[9px] text-text-muted"
                              rowClassName="flex items-center gap-1.5 rounded-full border border-primary/22 bg-primary/[0.05] py-0.5 pl-1 pr-0.5 shadow-sm"
                              badgeClassName="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold tabular-nums text-primary"
                              inputClassName="h-7 flex-1 min-w-0 border-0 bg-transparent px-1.5 text-[10px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              removeButtonClassName="h-7 w-7 shrink-0 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              addTaskButtonClassName="h-7 rounded-full border-primary/25 text-[10px] text-primary hover:bg-primary/[0.06]"
                              onChange={(next) =>
                                setCustomMilestoneDrafts((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, tasks: next } : d,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 h-8 w-full rounded-[10px] border-primary/22 text-[10px] text-primary hover:bg-primary/[0.05]"
                    onClick={() =>
                      setCustomMilestoneDrafts((prev) => [
                        ...prev,
                        { title: "", tasks: [""] },
                      ])
                    }
                  >
                    <Plus className="mr-1.5 h-3 w-3" />
                    Add milestone
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-primary/12 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("custom")}
                  className="h-9 flex-1 rounded-[10px] border-primary/22 text-[10px] text-card-foreground hover:bg-primary/[0.05]"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCustomOutcome}
                  disabled={
                    customMilestoneDrafts.length === 0 ||
                    !customTitle.trim() ||
                    !customDescription.trim()
                  }
                  className="h-9 flex-1 rounded-[10px] text-[10px] shadow-sm"
                >
                  <CheckCircle2 className="mr-1.5 h-3 w-3" />
                  Create outcome
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
