import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Target, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
export default function Operations({ user, onBack }) {
  const [operationsPlan, setOperationsPlan] = useState({
    processes: "",
    metrics: "",
    growthGoals: "",
  });

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem("operations_plan");
    if (savedData) {
      setOperationsPlan(JSON.parse(savedData));
    }
  }, []);

  // Save and complete journey
  const saveAndComplete = () => {
    localStorage.setItem("operations_plan", JSON.stringify(operationsPlan));
    toast.success("🎉 Journey completed! All stages saved.");
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
              <Target className="w-8 h-8 text-foreground" />
              Stage 6: Operations & Growth
            </h1>
            <p className="text-muted-foreground">
              Scale operations and optimize for growth
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Operations & Growth Planning</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define your operational processes and growth strategy
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="processes">Key Business Processes</Label>
              <Textarea
                id="processes"
                placeholder="e.g., Customer onboarding flow, Support workflow, Sales process"
                value={operationsPlan.processes}
                onChange={(e) =>
                  setOperationsPlan({
                    ...operationsPlan,
                    processes: e.target.value,
                  })
                }
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metrics">Key Metrics to Track</Label>
              <Textarea
                id="metrics"
                placeholder="e.g., MRR, CAC, LTV, Churn Rate, NPS"
                value={operationsPlan.metrics}
                onChange={(e) =>
                  setOperationsPlan({
                    ...operationsPlan,
                    metrics: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="growthGoals">Growth Goals & Milestones</Label>
              <Textarea
                id="growthGoals"
                placeholder="e.g., 100 customers in 6 months, $10k MRR by Q4, Expand to 2 new markets"
                value={operationsPlan.growthGoals}
                onChange={(e) =>
                  setOperationsPlan({
                    ...operationsPlan,
                    growthGoals: e.target.value,
                  })
                }
                rows={5}
              />
            </div>
            <div className="pt-4">
              <Button
                onClick={saveAndComplete}
                className="w-full gap-2"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Complete Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
