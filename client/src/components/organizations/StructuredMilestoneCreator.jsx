/**
 * STRUCTURED MILESTONE CREATOR
 * Enhanced milestone/deliverable creation for organizations
 * Generates the same quality structure that founders get
 */
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  Sparkles,
  Target,
  CheckCircle2,
  Plus,
  Trash2,
  Wand2,
  Lightbulb,
  X,
} from "lucide-react";
import { SectionCard } from "./_primitives";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "deliverable", label: "Deliverable" },
  { value: "checkpoint", label: "Checkpoint" },
  { value: "validation", label: "Validation" },
  { value: "customer-research", label: "Customer Research" },
  { value: "product", label: "Product Development" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
];

const PRIMARY_BUTTON =
  "h-10 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-10 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

export default function StructuredMilestoneCreator({
  isOpen,
  onClose,
  onSubmit,
  type,
  milestone,
}) {
  const isEditMode = Boolean(milestone);
  // In edit mode we skip the "input" gate; otherwise we start at the first step.
  const [step, setStep] = useState(isEditMode ? "structure" : "input");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    week: "",
    category: type === "deliverable" ? "deliverable" : "general",
  });
  const [milestones, setMilestones] = useState([
    { title: "", tasks: ["", "", ""] },
    { title: "", tasks: ["", "", ""] },
    { title: "", tasks: ["", "", ""] },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Hydrate form/milestones whenever the dialog opens or the edit target changes.
  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode) {
      const dueDate = milestone.dueDate
        ? new Date(milestone.dueDate).toISOString().slice(0, 10)
        : "";
      setFormData({
        title: milestone.title || "",
        description: milestone.description || "",
        dueDate,
        week: milestone.week != null ? String(milestone.week) : "",
        category:
          milestone.category ||
          (type === "deliverable" ? "deliverable" : "general"),
      });
      const sm = Array.isArray(milestone.structuredMilestones)
        ? milestone.structuredMilestones
        : [];
      setMilestones(
        sm.length > 0
          ? sm.map((m) => ({
              title: m.title || "",
              tasks:
                Array.isArray(m.tasks) && m.tasks.length > 0
                  ? m.tasks.slice()
                  : [""],
            }))
          : [{ title: "", tasks: [""] }],
      );
      setStep("structure");
    } else {
      // Reset for a fresh "create" pass when reopening without a target.
      setStep("input");
    }
  }, [isOpen, isEditMode, milestone, type]);

  const resetState = () => {
    setStep("input");
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      week: "",
      category: type === "deliverable" ? "deliverable" : "general",
    });
    setMilestones([
      { title: "", tasks: ["", "", ""] },
      { title: "", tasks: ["", "", ""] },
      { title: "", tasks: ["", "", ""] },
    ]);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      onClose && onClose();
    }
  };

  const handleGenerateStructure = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateMilestoneStructure(
        formData.title,
        formData.description,
      );
      setMilestones(generated);
      setIsGenerating(false);
      setStep("structure");
    }, 800);
  };

  const handleAddTask = (milestoneIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].tasks.push("");
    setMilestones(updated);
  };

  const handleRemoveTask = (milestoneIndex, taskIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].tasks.splice(taskIndex, 1);
    setMilestones(updated);
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      { title: "", tasks: ["", "", ""] },
    ]);
  };

  const handleRemoveMilestone = (index) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.dueDate) {
      toast.error("Please fill in title and due date");
      return;
    }
    const validMilestones = milestones
      .filter((m) => m.title.trim())
      .map((m) => ({
        title: m.title,
        tasks: m.tasks.filter((t) => t.trim()),
      }))
      .filter((m) => m.tasks.length > 0);
    if (validMilestones.length === 0) {
      toast.error("Please add at least one milestone with tasks");
      return;
    }
    await onSubmit({
      ...formData,
      week: formData.week ? parseInt(formData.week) : null,
      milestones: validMilestones,
    });
    resetState();
  };

  const totalTasks = milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.trim()).length,
    0,
  );

  const titleLabel = type === "deliverable" ? "Deliverable" : "Program Milestone";
  const verb = isEditMode ? "Edit" : "Create";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
        <div className="px-6 pt-6">
          <DialogHeader className="border-b border-surface-border pb-4 text-left">
            <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
              <Sparkles className="h-5 w-5 text-primary" />
              {verb} {titleLabel}
            </DialogTitle>
            <DialogDescription className="font-body text-[13px] text-text-body">
              {step === "input" &&
                "Define what you want startups to accomplish"}
              {step === "structure" &&
                "AI-generated structure - customize as needed"}
              {step === "review" && "Review and confirm"}
            </DialogDescription>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full ${step === "input" || step === "structure" || step === "review" ? "bg-primary" : "bg-surface-border"}`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full ${step === "structure" || step === "review" ? "bg-primary" : "bg-surface-border"}`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full ${step === "review" ? "bg-primary" : "bg-surface-border"}`}
              />
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 pb-6 font-body">
          {step === "input" && (
            <>
              <div className="flex gap-3 rounded-input border border-primary/20 bg-primary-tint p-4">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-heading text-[14px] font-semibold text-primary">
                    Create Structured Goals for Your Cohort
                  </p>
                  <p className="mt-1 font-body text-[13px] text-text-body">
                    This will be automatically converted into a weekly outcome
                    with milestones and tasks for all founders in your cohort.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  {titleLabel} Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Complete Customer Discovery & Validation"
                  className="font-body text-[13px]"
                />
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What should founders accomplish? Be specific about deliverables and success criteria..."
                  className="min-h-[100px] font-body text-[13px]"
                />
                <p className="mt-2 font-body text-[12px] text-text-muted">
                  Tip: Be specific - this helps generate a better milestone
                  structure
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="font-body text-[13px]"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Week Number (optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.week}
                    onChange={(e) =>
                      setFormData({ ...formData, week: e.target.value })
                    }
                    placeholder="e.g., 1"
                    className="font-body text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="font-body text-[13px]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="font-body text-[13px]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="border-t border-surface-border pt-4 sm:justify-start">
                <Button
                  onClick={handleGenerateStructure}
                  disabled={
                    !formData.title || !formData.dueDate || isGenerating
                  }
                  className={PRIMARY_BUTTON}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isGenerating
                    ? "Generating Structure..."
                    : "Generate Milestone Structure"}
                </Button>
                <Button onClick={onClose} className={OUTLINE_BUTTON}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "structure" && (
            <>
              <div className="flex gap-3 rounded-input border border-primary/20 bg-primary-tint p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-heading text-[14px] font-semibold text-text-heading">
                    {formData.title}
                  </p>
                  <p className="mt-1 font-body text-[12px] text-text-muted">
                    {milestones.filter((m) => m.title.trim()).length} milestones
                    {" · "}
                    {totalTasks} tasks
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone, mIndex) => (
                  <SectionCard key={mIndex}>
                    <SectionCard.Body>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint font-heading text-[14px] font-semibold text-primary">
                          {mIndex + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Input
                            value={milestone.title}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[mIndex].title = e.target.value;
                              setMilestones(updated);
                            }}
                            placeholder="Milestone title..."
                            className="font-body text-[13px] font-medium"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <Button
                            size="sm"
                            onClick={() => handleRemoveMilestone(mIndex)}
                            className="h-9 w-9 rounded-input p-0 text-[#ff4f6b] hover:bg-[#fff1f2]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {milestone.tasks.map((task, tIndex) => (
                          <div key={tIndex} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-text-muted" />
                            <Input
                              value={task}
                              onChange={(e) => {
                                const updated = [...milestones];
                                updated[mIndex].tasks[tIndex] = e.target.value;
                                setMilestones(updated);
                              }}
                              placeholder="Task description..."
                              className="font-body text-[13px]"
                            />
                            {milestone.tasks.length > 1 && (
                              <Button
                                size="sm"
                                onClick={() => handleRemoveTask(mIndex, tIndex)}
                                className="h-9 w-9 rounded-input p-0 text-[#ff4f6b] hover:bg-[#fff1f2]"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={() => handleAddTask(mIndex)}
                          className={`mt-1 w-full ${OUTLINE_BUTTON}`}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Task
                        </Button>
                      </div>
                    </SectionCard.Body>
                  </SectionCard>
                ))}
              </div>

              <Button
                onClick={handleAddMilestone}
                className={`w-full ${OUTLINE_BUTTON}`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>

              <DialogFooter className="border-t border-surface-border pt-4 sm:justify-start">
                <Button
                  onClick={() => setStep("review")}
                  className={PRIMARY_BUTTON}
                >
                  Continue to Review
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setStep("input")}
                  className={OUTLINE_BUTTON}
                >
                  Back
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "review" && (
            <>
              <div className="flex gap-3 rounded-input border border-[#d1fae5] bg-[#ecfdf5] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00c896]" />
                <div>
                  <p className="font-heading text-[14px] font-semibold text-text-heading">
                    Ready to Deploy
                  </p>
                  <p className="mt-1 font-body text-[13px] text-text-body">
                    This will create a structured weekly outcome for all
                    founders in your cohort
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 font-body text-[12px] text-text-muted">
                    Title
                  </p>
                  <p className="font-heading text-[14px] font-semibold text-text-heading">
                    {formData.title}
                  </p>
                </div>
                {formData.description && (
                  <div>
                    <p className="mb-1 font-body text-[12px] text-text-muted">
                      Description
                    </p>
                    <p className="font-body text-[13px] text-text-body">
                      {formData.description}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 font-body text-[12px] text-text-muted">
                      Due Date
                    </p>
                    <p className="font-body text-[13px] text-text-body">
                      {new Date(formData.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  {formData.week && (
                    <div>
                      <p className="mb-1 font-body text-[12px] text-text-muted">
                        Week
                      </p>
                      <p className="font-body text-[13px] text-text-body">
                        Week {formData.week}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 font-body text-[12px] text-text-muted">
                      Category
                    </p>
                    <Badge
                      variant="outline"
                      className="rounded-full border-0 bg-primary-tint px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize text-primary"
                    >
                      {formData.category}
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-surface-border pt-3">
                  <p className="mb-3 font-body text-[12px] text-text-muted">
                    Structure Summary
                  </p>
                  <div className="space-y-2">
                    {milestones
                      .filter((m) => m.title.trim())
                      .map((milestone, idx) => (
                        <div
                          key={idx}
                          className="rounded-input bg-surface-page p-3"
                        >
                          <p className="font-heading text-[13px] font-semibold text-text-heading">
                            {idx + 1}. {milestone.title}
                          </p>
                          <p className="ml-4 font-body text-[12px] text-text-muted">
                            {milestone.tasks.filter((t) => t.trim()).length}{" "}
                            tasks
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-surface-border pt-4 sm:justify-start">
                <Button onClick={handleSubmit} className={PRIMARY_BUTTON}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isEditMode
                    ? "Save Changes"
                    : "Create & Deploy to Cohort"}
                </Button>
                <Button
                  onClick={() => setStep("structure")}
                  className={OUTLINE_BUTTON}
                >
                  Back to Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generate intelligent milestone structure based on input
 * This mimics the founder's intent parser but optimized for organization use
 */
function generateMilestoneStructure(title, description) {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const combined = `${lowerTitle} ${lowerDesc}`;

  if (
    combined.includes("customer") ||
    combined.includes("interview") ||
    combined.includes("validate") ||
    combined.includes("research")
  ) {
    return [
      {
        title: "Research Plan & Preparation",
        tasks: [
          "Define target customer profile",
          "Create interview guide with key questions",
          "Prepare documentation template",
          "Set validation success criteria",
        ],
      },
      {
        title: "Recruit & Schedule Participants",
        tasks: [
          "Identify potential interview candidates",
          "Reach out and invite participants",
          "Schedule interview sessions",
          "Send confirmations and reminders",
        ],
      },
      {
        title: "Conduct Research & Analyze",
        tasks: [
          "Complete all scheduled interviews",
          "Document insights and key quotes",
          "Identify patterns and themes",
          "Create summary report with findings",
        ],
      },
    ];
  }

  if (
    combined.includes("product") ||
    combined.includes("build") ||
    combined.includes("mvp") ||
    combined.includes("develop") ||
    combined.includes("feature")
  ) {
    return [
      {
        title: "Define Product Scope",
        tasks: [
          "List core features and requirements",
          "Create product specifications",
          "Design user flows and mockups",
          "Set technical architecture",
        ],
      },
      {
        title: "Development Sprint",
        tasks: [
          "Build core functionality",
          "Implement user interface",
          "Set up testing environment",
          "Fix critical bugs and issues",
        ],
      },
      {
        title: "Testing & Launch Prep",
        tasks: [
          "Complete QA testing",
          "Gather beta user feedback",
          "Prepare launch materials",
          "Deploy to production",
        ],
      },
    ];
  }

  if (
    combined.includes("marketing") ||
    combined.includes("campaign") ||
    combined.includes("launch") ||
    combined.includes("promotion")
  ) {
    return [
      {
        title: "Campaign Strategy",
        tasks: [
          "Define target audience and messaging",
          "Choose marketing channels",
          "Create content calendar",
          "Set campaign metrics and goals",
        ],
      },
      {
        title: "Content Creation",
        tasks: [
          "Write copy and create visuals",
          "Design landing pages",
          "Prepare social media posts",
          "Record videos or demos",
        ],
      },
      {
        title: "Launch & Monitor",
        tasks: [
          "Deploy campaign across channels",
          "Monitor performance metrics",
          "Engage with audience responses",
          "Optimize based on results",
        ],
      },
    ];
  }

  if (
    combined.includes("sales") ||
    combined.includes("customer") ||
    combined.includes("close") ||
    combined.includes("revenue")
  ) {
    return [
      {
        title: "Sales Pipeline Setup",
        tasks: [
          "Define ideal customer profile",
          "Create sales materials and deck",
          "Build prospect list",
          "Set up CRM tracking",
        ],
      },
      {
        title: "Outreach & Demos",
        tasks: [
          "Reach out to prospects",
          "Schedule sales calls",
          "Deliver product demos",
          "Address objections and questions",
        ],
      },
      {
        title: "Close Deals",
        tasks: [
          "Send proposals and quotes",
          "Negotiate terms",
          "Close signed agreements",
          "Onboard new customers",
        ],
      },
    ];
  }

  if (
    combined.includes("fundrais") ||
    combined.includes("investor") ||
    combined.includes("pitch") ||
    combined.includes("capital")
  ) {
    return [
      {
        title: "Fundraising Preparation",
        tasks: [
          "Update pitch deck",
          "Prepare financial projections",
          "Create investor target list",
          "Practice pitch delivery",
        ],
      },
      {
        title: "Investor Outreach",
        tasks: [
          "Send warm introductions",
          "Schedule investor meetings",
          "Deliver pitch presentations",
          "Follow up with materials",
        ],
      },
      {
        title: "Due Diligence & Close",
        tasks: [
          "Provide requested documentation",
          "Negotiate term sheets",
          "Complete legal review",
          "Close funding round",
        ],
      },
    ];
  }

  return [
    {
      title: "Planning & Setup",
      tasks: [
        "Define specific goals and success criteria",
        "Create detailed action plan",
        "Gather necessary resources",
        "Set up tracking and milestones",
      ],
    },
    {
      title: "Execution Phase",
      tasks: [
        "Complete core work items",
        "Monitor progress regularly",
        "Address blockers and issues",
        "Adjust approach as needed",
      ],
    },
    {
      title: "Completion & Review",
      tasks: [
        "Finalize all deliverables",
        "Review outcomes vs goals",
        "Document learnings",
        "Prepare summary report",
      ],
    },
  ];
}
