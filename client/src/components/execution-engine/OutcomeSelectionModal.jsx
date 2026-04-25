import React, { useState } from "react";
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
} from "lucide-react";
import { getOutcomeTemplatesForStage } from "../../utils/executionEngine";
export default function OutcomeSelectionModal({
  isOpen,
  onClose,
  currentStage,
  stageName,
  weekNumber,
  onSelectOutcome,
  onOpenIntentCapture,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [step, setStep] = useState("select");
  if (!isOpen) return null;
  const templates = getOutcomeTemplatesForStage(currentStage);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    setStep("review");
  };
  const handleConfirmOutcome = async () => {
    if (!selectedTemplateId) return;
    try {
      await onSelectOutcome(
        selectedTemplateId,
        customMode ? customTitle : undefined,
        customMode ? customDescription : undefined,
      );
    } catch {
      /* parent toasts and may re-open modal */
    }
  };
  const handleCustomOutcome = () => {
    setCustomMode(true);
    setStep("custom");
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <CardHeader className="pb-2 pt-2 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                Select Your Weekly Outcome
              </CardTitle>
              <CardDescription className="mt-0.5 text-[9px]">
                {"Week "}
                {weekNumber}
                {" • "}
                {stageName}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-3 pb-3">
          {step === "select" && (
            <>
              {onOpenIntentCapture && (
                <button
                  type="button"
                  aria-label="Describe in Your Own Words"
                  onClick={() => {
                    onOpenIntentCapture();
                  }}
                  className="p-3 border-2 border-primary rounded-lg bg-gradient-to-r from-primary/10 to-purple-50 dark:from-primary/20 dark:to-purple-950/20 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="text-[10px] font-semibold">
                          Describe in Your Own Words
                        </h3>
                        <Badge className="bg-primary text-[8px] px-1.5 py-0 h-4">
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Tell us what you want to accomplish this week in plain
                        English. Our algorithm will translate it into a
                        structured outcome with milestones and tasks.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium group-hover:gap-2 transition-all">
                        <Sparkles className="w-3 h-3" />
                        <span>Try the smart way</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </button>
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[9px] uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or choose a template
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-[10px]">
                  {"Recommended Outcomes for "}
                  {stageName}
                </h3>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Choose one focused outcome to achieve this week. These are
                  proven outcomes for startups at your stage.
                </p>
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-2.5 border-2 rounded-lg hover:border-primary/50 cursor-pointer transition-all group"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[10px] mb-1 group-hover:text-primary">
                          {template.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mb-1.5">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            {template.defaultMilestones.length}
                            {" milestones"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full h-7 text-[10px]"
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
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
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
                        <p className="text-[10px] text-muted-foreground">
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
                  Milestones ({selectedTemplate.defaultMilestones.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedTemplate.defaultMilestones.map(
                    (milestone, index) => (
                      <div
                        key={index}
                        className="p-2 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[10px] mb-0.5">
                              {milestone.title}
                            </p>
                            <div className="text-[9px] text-muted-foreground">
                              {milestone.defaultTasks.length}
                              {" tasks"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select");
                    setSelectedTemplateId(null);
                    setCustomMode(false);
                  }}
                  className="flex-1 h-7 text-[10px]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmOutcome}
                  disabled={
                    customMode &&
                    (!customTitle.trim() || !customDescription.trim())
                  }
                  className="flex-1 h-7 text-[10px]"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Set This Week's Outcome
                </Button>
              </div>
            </>
          )}
          {step === "custom" && (
            <>
              <div className="space-y-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div className="flex gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-blue-900 dark:text-blue-100">
                      <p className="font-medium mb-0.5">
                        Creating a Custom Outcome
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Define one clear, achievable outcome for this week.
                        You'll break it into milestones in the next step.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px]">Outcome Title *</Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g., Validate problem with 10 user interviews"
                    className="mt-1 h-7 text-[10px]"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Description *</Label>
                  <Textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Describe what success looks like and why this outcome matters this week..."
                    className="mt-1 min-h-[70px] text-[10px]"
                  />
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">
                    {"💡 "}
                    <strong>Tip:</strong>
                    {
                      " Good outcomes are specific, measurable, and achievable in one week. Focus on "
                    }
                    <em>progress</em>, not perfection.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select");
                    setCustomMode(false);
                    setCustomTitle("");
                    setCustomDescription("");
                  }}
                  className="flex-1 h-7 text-[10px]"
                >
                  Back to Templates
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await onSelectOutcome(
                        "custom",
                        customTitle,
                        customDescription,
                      );
                    } catch {
                      /* parent toasts */
                    }
                  }}
                  disabled={!customTitle.trim() || !customDescription.trim()}
                  className="flex-1 h-7 text-[10px]"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Create Outcome
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
