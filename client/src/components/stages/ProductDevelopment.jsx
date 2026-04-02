import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Rocket, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
export default function ProductDevelopment({ user, onBack }) {
  const [productPlan, setProductPlan] = useState({
    mvpFeatures: "",
    techStack: "",
    timeline: "",
  });

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem("product_plan");
    if (savedData) {
      setProductPlan(JSON.parse(savedData));
    }
  }, []);

  // Save and continue to next stage
  const saveAndContinue = () => {
    localStorage.setItem("product_plan", JSON.stringify(productPlan));
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
              <Rocket className="w-8 h-8 text-foreground" />
              Stage 4: Product Development
            </h1>
            <p className="text-muted-foreground">Build and iterate your MVP</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Product Planning</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define your MVP and development approach
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mvpFeatures">Core MVP Features</Label>
              <Textarea
                id="mvpFeatures"
                placeholder="List the essential features for your minimum viable product"
                value={productPlan.mvpFeatures}
                onChange={(e) =>
                  setProductPlan({
                    ...productPlan,
                    mvpFeatures: e.target.value,
                  })
                }
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="techStack">Technology Stack</Label>
              <Textarea
                id="techStack"
                placeholder="e.g., React, Node.js, PostgreSQL, AWS"
                value={productPlan.techStack}
                onChange={(e) =>
                  setProductPlan({
                    ...productPlan,
                    techStack: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Development Timeline</Label>
              <Textarea
                id="timeline"
                placeholder="e.g., MVP in 8 weeks, Beta in 12 weeks, Public launch in 16 weeks"
                value={productPlan.timeline}
                onChange={(e) =>
                  setProductPlan({
                    ...productPlan,
                    timeline: e.target.value,
                  })
                }
                rows={4}
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
