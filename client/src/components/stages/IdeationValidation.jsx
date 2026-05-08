import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Lightbulb, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useHydrateStageDraft, persistStageDraft } from "../../hooks/useStageDraftFromJourney";

export default function IdeationValidation({ user, onBack }) {
  const [ideaCanvas, setIdeaCanvas] = useState({
    problem: "",
    solution: "",
    targetAudience: "",
    valueProposition: "",
  });

  useHydrateStageDraft(user, "ideation_canvas", (raw) => {
    if (!raw || typeof raw !== "object") return;
    setIdeaCanvas({
      problem: raw.problem || "",
      solution: raw.solution || "",
      targetAudience: raw.targetAudience || "",
      valueProposition: raw.valueProposition || "",
    });
  });

  const saveAndContinue = () => {
    persistStageDraft("ideation_canvas", ideaCanvas);
    toast.success("Progress saved! Moving to next stage...");
    setTimeout(() => onBack(), 500);
  };
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Journey
          </Button>
          <div>
            <h1 className="mb-2 flex items-center gap-2">
              <Lightbulb className="w-8 h-8 text-foreground" />
              Stage 1: Ideation & Validation
            </h1>
            <p className="text-muted-foreground">
              Validate your idea before building anything
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Idea Canvas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define the core elements of your startup idea
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="problem">What problem are you solving?</Label>
              <Textarea
                id="problem"
                placeholder="Describe the problem in detail. Who has this problem? How painful is it?"
                value={ideaCanvas.problem}
                onChange={(e) =>
                  setIdeaCanvas({
                    ...ideaCanvas,
                    problem: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution">Your Solution</Label>
              <Textarea
                id="solution"
                placeholder="How does your product/service solve this problem?"
                value={ideaCanvas.solution}
                onChange={(e) =>
                  setIdeaCanvas({
                    ...ideaCanvas,
                    solution: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target Audience</Label>
              <Input
                id="target"
                placeholder="e.g., Small business owners, Remote teams, Healthcare professionals"
                value={ideaCanvas.targetAudience}
                onChange={(e) =>
                  setIdeaCanvas({
                    ...ideaCanvas,
                    targetAudience: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value Proposition</Label>
              <Textarea
                id="value"
                placeholder="Why should customers choose you? What unique value do you provide?"
                value={ideaCanvas.valueProposition}
                onChange={(e) =>
                  setIdeaCanvas({
                    ...ideaCanvas,
                    valueProposition: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="pt-4">
              <Button
                onClick={saveAndContinue}
                className="w-full gap-2"
                size="lg"
              >
                Save & Continue to Next Stage
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
