/**
 * STRUCTURED MILESTONE CREATOR
 * Enhanced milestone/deliverable creation for organizations
 * Generates the same quality structure that founders get
 */
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
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
export default function StructuredMilestoneCreator({
  isOpen,
  onClose,
  onSubmit,
  type,
}) {
  const [step, setStep] = useState("input");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    week: "",
    category: type === "deliverable" ? "deliverable" : "general",
  });
  const [milestones, setMilestones] = useState([
    {
      title: "",
      tasks: ["", "", ""],
    },
    {
      title: "",
      tasks: ["", "", ""],
    },
    {
      title: "",
      tasks: ["", "", ""],
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  if (!isOpen) return null;
  const handleGenerateStructure = () => {
    setIsGenerating(true);

    // Simulate AI processing
    setTimeout(() => {
      // Generate intelligent structure based on title and description
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
      {
        title: "",
        tasks: ["", "", ""],
      },
    ]);
  };
  const handleRemoveMilestone = (index) => {
    if (milestones.length > 1) {
      const updated = milestones.filter((_, i) => i !== index);
      setMilestones(updated);
    }
  };
  const handleSubmit = async () => {
    // Validate
    if (!formData.title || !formData.dueDate) {
      alert("Please fill in title and due date");
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
      alert("Please add at least one milestone with tasks");
      return;
    }
    await onSubmit({
      ...formData,
      week: formData.week ? parseInt(formData.week) : null,
      milestones: validMilestones,
    });

    // Reset
    setStep("input");
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      week: "",
      category: type === "deliverable" ? "deliverable" : "general",
    });
    setMilestones([
      {
        title: "",
        tasks: ["", "", ""],
      },
      {
        title: "",
        tasks: ["", "", ""],
      },
      {
        title: "",
        tasks: ["", "", ""],
      },
    ]);
  };
  const totalTasks = milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.trim()).length,
    0,
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[16px] border-0 shadow-modal">
        <CardHeader className="border-b pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {"Create "}
                {type === "deliverable" ? "Deliverable" : "Program Milestone"}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {step === "input" &&
                  "Define what you want startups to accomplish"}
                {step === "structure" &&
                  "AI-generated structure - customize as needed"}
                {step === "review" && "Review and confirm"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`flex-1 h-1 rounded ${step === "input" || step === "structure" || step === "review" ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`flex-1 h-1 rounded ${step === "structure" || step === "review" ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`flex-1 h-1 rounded ${step === "review" ? "bg-primary" : "bg-muted"}`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {step === "input" && (
            <>
              <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-50 dark:from-primary/20 dark:to-purple-950/20 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary mb-1">
                      Create Structured Goals for Your Cohort
                    </p>
                    <p className="text-muted-foreground text-xs">
                      This will be automatically converted into a weekly outcome
                      with milestones and tasks for all founders in your cohort.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {type === "deliverable" ? "Deliverable" : "Milestone"}
                  {" Title *"}
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Complete Customer Discovery & Validation"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="What should founders accomplish? Be specific about deliverables and success criteria..."
                  className="text-sm min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Be specific - this helps generate better milestone
                  structure
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dueDate: e.target.value,
                      })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Week Number (optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.week}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        week: e.target.value,
                      })
                    }
                    placeholder="e.g., 1"
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className="w-full h-9 text-sm rounded-md border border-input bg-background px-3"
                >
                  <option value="general">General</option>
                  <option value="deliverable">Deliverable</option>
                  <option value="checkpoint">Checkpoint</option>
                  <option value="validation">Validation</option>
                  <option value="customer-research">Customer Research</option>
                  <option value="product">Product Development</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleGenerateStructure}
                  disabled={
                    !formData.title || !formData.dueDate || isGenerating
                  }
                  className="gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  {isGenerating
                    ? "Generating Structure..."
                    : "Generate Milestone Structure"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
          {step === "structure" && (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex gap-3">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {formData.title}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs">
                      {milestones.filter((m) => m.title.trim()).length}
                      {" milestones • "}
                      {totalTasks}
                      {" tasks"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {milestones.map((milestone, mIndex) => (
                  <Card key={mIndex} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                          {mIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Input
                            value={milestone.title}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[mIndex].title = e.target.value;
                              setMilestones(updated);
                            }}
                            placeholder="Milestone title..."
                            className="text-sm font-medium"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMilestone(mIndex)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {milestone.tasks.map((task, tIndex) => (
                        <div key={tIndex} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            value={task}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[mIndex].tasks[tIndex] = e.target.value;
                              setMilestones(updated);
                            }}
                            placeholder="Task description..."
                            className="text-xs"
                          />
                          {milestone.tasks.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTask(mIndex, tIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTask(mIndex)}
                        className="w-full text-xs mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Task
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={handleAddMilestone}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </Button>
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setStep("review")} className="gap-2">
                  Continue to Review
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setStep("input")}>
                  Back
                </Button>
              </div>
            </>
          )}
          {step === "review" && (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Ready to Deploy
                    </p>
                    <p className="text-green-700 dark:text-green-300 text-xs">
                      This will create a structured weekly outcome for all
                      founders in your cohort
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Title</p>
                  <p className="text-sm font-medium">{formData.title}</p>
                </div>
                {formData.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Due Date
                    </p>
                    <p className="text-sm">
                      {new Date(formData.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  {formData.week && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Week</p>
                      <p className="text-sm">
                        {"Week "}
                        {formData.week}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Category
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {formData.category}
                    </Badge>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-3">
                    Structure Summary
                  </p>
                  <div className="space-y-2">
                    {milestones
                      .filter((m) => m.title.trim())
                      .map((milestone, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded-md">
                          <p className="text-xs font-medium">
                            {idx + 1}
                            {". "}
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground ml-4">
                            {milestone.tasks.filter((t) => t.trim()).length}
                            {" tasks"}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSubmit} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Create & Deploy to Cohort
                </Button>
                <Button variant="outline" onClick={() => setStep("structure")}>
                  Back to Edit
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
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

  // Customer Research / Validation
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

  // Product Development / MVP
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

  // Marketing / Launch Campaign
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

  // Sales / Customer Acquisition
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

  // Fundraising
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

  // Generic structure for everything else
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
