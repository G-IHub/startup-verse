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
  Sparkles,
  X,
  Lightbulb,
  Target,
  ChevronRight,
  Edit3,
  CheckCircle2,
  Wand2,
  TrendingUp,
} from "lucide-react";
import {
  parseFounderIntent,
  suggestRefinements,
} from "../../utils/intentParser";
import MilestoneTaskFieldList from "./MilestoneTaskFieldList.jsx";
const EXAMPLE_INTENTS = [
  "Validate our pricing with 10 potential customers",
  "Build MVP of our mobile app with core features",
  "Find and onboard a technical co-founder",
  "Launch our first marketing campaign on social media",
  "Close our first 5 paying customers",
];
export default function IntentCaptureModal({
  isOpen,
  onClose,
  stageName,
  weekNumber,
  onParseIntent,
  onConfirmIntent,
}) {
  const [step, setStep] = useState("input");
  const [userInput, setUserInput] = useState("");
  const [parsedIntent, setParsedIntent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [milestoneDrafts, setMilestoneDrafts] = useState([]);
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep("input");
      setUserInput("");
      setParsedIntent(null);
      setIsEditing(false);
      setCustomTitle("");
      setCustomDescription("");
      setMilestoneDrafts([]);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!parsedIntent?.suggestedMilestones?.length) {
      setMilestoneDrafts([]);
      return;
    }
    setMilestoneDrafts(
      parsedIntent.suggestedMilestones.map((m) => {
        const rowTasks = (Array.isArray(m.tasks) ? m.tasks : [])
          .map((t) => (typeof t === "string" ? t : String(t?.title || "")))
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          title: String(m.title || ""),
          tasks: rowTasks.length > 0 ? rowTasks : [""],
        };
      }),
    );
  }, [parsedIntent]);
  if (!isOpen) return null;
  const handleAnalyzeIntent = async () => {
    if (!userInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const parsed =
        typeof onParseIntent === "function"
          ? await onParseIntent(userInput.trim())
          : parseFounderIntent(userInput.trim());
      setParsedIntent(parsed);
      setCustomTitle(parsed.suggestedTitle);
      setCustomDescription(parsed.suggestedDescription);
      setStep("review");
    } catch {
      const parsed = parseFounderIntent(userInput.trim());
      setParsedIntent(parsed);
      setCustomTitle(parsed.suggestedTitle);
      setCustomDescription(parsed.suggestedDescription);
      setStep("review");
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleConfirm = async () => {
    if (!parsedIntent) return;
    const suggestedMilestones = milestoneDrafts.map((draft, i) => {
      const orig = parsedIntent.suggestedMilestones[i];
      const lines = (Array.isArray(draft.tasks) ? draft.tasks : [])
        .map((s) => String(s || "").trim())
        .filter(Boolean);
      const origTasks = (Array.isArray(orig?.tasks) ? orig.tasks : [])
        .map((t) => (typeof t === "string" ? t : String(t?.title || "")))
        .filter(Boolean);
      return {
        title:
          draft.title.trim() ||
          String(orig?.title || "").trim() ||
          `Milestone ${i + 1}`,
        tasks: lines.length > 0 ? lines : origTasks,
      };
    });
    try {
      await onConfirmIntent(
        { ...parsedIntent, suggestedMilestones },
        isEditing ? customTitle : undefined,
        isEditing ? customDescription : undefined,
      );
    } catch {
      /* parent toasts; modal stays open unless parent closed on success */
    }
  };
  const handleUseExample = (example) => {
    setUserInput(example);
  };
  const refinements = parsedIntent ? suggestRefinements(parsedIntent) : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border-0 shadow-modal">
        <CardHeader className="pb-3 pt-3 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                What do you want to achieve this week?
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {"Week "}
                {weekNumber}
                {" • "}
                {stageName}
                {" • Describe your goal in your own words"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "input" && (
            <>
              <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-50 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary mb-1">
                      Tell us your goal in your own words
                    </p>
                    <p className="text-muted-foreground">
                      Describe what you want to accomplish this week. Our system
                      will translate it into a structured outcome with
                      milestones and tasks.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What's your main focus this week?
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Example: I want to validate our pricing with 10 customer interviews..."
                  className="min-h-[120px] text-base"
                  autoFocus={true}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be as specific as possible. Include numbers, deliverables, or
                  outcomes you want to achieve.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-3">
                  Need inspiration? Try these:
                </p>
                <div className="space-y-2">
                  {EXAMPLE_INTENTS.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleUseExample(example)}
                      className="group w-full rounded-xl border border-primary/20 bg-card p-3 text-left shadow-sm transition-all hover:border-primary/35 hover:bg-primary/[0.03] hover:shadow"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-card-foreground">
                          {example}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 border-t border-primary/12 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAnalyzeIntent}
                  disabled={!userInput.trim() || isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
          {step === "review" && parsedIntent && (
            <>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    parsedIntent.confidence >= 0.8
                      ? "border-green-500 text-green-700"
                      : parsedIntent.confidence >= 0.6
                        ? "border-yellow-500 text-yellow-700"
                        : "border-orange-500 text-orange-700"
                  }
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {Math.round(parsedIntent.confidence * 100)}% confidence match
                </Badge>
                <Badge variant="secondary">
                  {parsedIntent.category.replace("-", " ")}
                </Badge>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            OUTCOME TITLE
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-base font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            DESCRIPTION
                          </label>
                          <Textarea
                            value={customDescription}
                            onChange={(e) =>
                              setCustomDescription(e.target.value)
                            }
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold mb-2">
                          {parsedIntent.suggestedTitle}
                        </h3>
                        <p className="text-muted-foreground">
                          {parsedIntent.suggestedDescription}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {isEditing ? "Done Editing" : "Customize Outcome"}
                </Button>
              </div>
              {parsedIntent.detectedKeywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Detected focus areas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedIntent.detectedKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generated Milestones ({milestoneDrafts.length})
                </h4>
                <p className="text-xs text-text-body mb-3 leading-relaxed">
                  Adjust milestone titles and tasks before saving.
                </p>
                <div className="space-y-3">
                  {milestoneDrafts.map((draft, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-primary/15 bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <Label className="text-xs text-text-muted">
                              Milestone title
                            </Label>
                            <Input
                              value={draft.title}
                              onChange={(e) => {
                                const v = e.target.value;
                                setMilestoneDrafts((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, title: v } : d,
                                  ),
                                );
                              }}
                              className="mt-1"
                            />
                          </div>
                          <MilestoneTaskFieldList
                            tasks={draft.tasks}
                            onChange={(next) =>
                              setMilestoneDrafts((prev) =>
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
              {refinements.length > 0 && parsedIntent.confidence < 0.8 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    💡 Suggestions to improve:
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {refinements.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setStep("input");
                      setParsedIntent(null);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Refine My Input
                  </Button>
                </div>
              )}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  YOUR ORIGINAL INPUT:
                </p>
                <p className="text-sm italic">"{parsedIntent.originalInput}"</p>
              </div>
              <div className="flex gap-3 border-t border-primary/12 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setParsedIntent(null);
                  }}
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={
                    isEditing &&
                    (!customTitle.trim() || !customDescription.trim())
                  }
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Set This Week's Outcome
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
