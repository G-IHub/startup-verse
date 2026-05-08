import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  useHydrateStageDraft,
  persistStageDraft,
} from "../../hooks/useStageDraftFromJourney";
export default function GoToMarket({ user, onBack }) {
  const [launchStrategy, setLaunchStrategy] = useState({
    targetCustomers: "",
    marketingChannels: "",
    pricingStrategy: "",
    launchPlan: "",
  });

  useHydrateStageDraft(user, "launch_strategy", (raw) => {
    if (!raw || typeof raw !== "object") return;
    setLaunchStrategy((prev) => ({ ...prev, ...raw }));
  });

  // Save and continue to next stage
  const saveAndContinue = () => {
    persistStageDraft("launch_strategy", launchStrategy);
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
              <TrendingUp className="w-8 h-8 text-foreground" />
              Stage 5: Go-to-Market
            </h1>
            <p className="text-muted-foreground">
              Launch and acquire your first customers
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Launch Strategy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Plan your market entry and customer acquisition
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetCustomers">Target Customers</Label>
              <Textarea
                id="targetCustomers"
                placeholder="Who are your ideal first customers? Where will you find them?"
                value={launchStrategy.targetCustomers}
                onChange={(e) =>
                  setLaunchStrategy({
                    ...launchStrategy,
                    targetCustomers: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketingChannels">Marketing Channels</Label>
              <Textarea
                id="marketingChannels"
                placeholder="e.g., LinkedIn, Product Hunt, Content marketing, Cold outreach"
                value={launchStrategy.marketingChannels}
                onChange={(e) =>
                  setLaunchStrategy({
                    ...launchStrategy,
                    marketingChannels: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricingStrategy">Pricing Strategy</Label>
              <Textarea
                id="pricingStrategy"
                placeholder="e.g., Free tier + $49/mo Pro, Annual discount, Usage-based pricing"
                value={launchStrategy.pricingStrategy}
                onChange={(e) =>
                  setLaunchStrategy({
                    ...launchStrategy,
                    pricingStrategy: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="launchPlan">Launch Plan</Label>
              <Textarea
                id="launchPlan"
                placeholder="Your step-by-step plan to launch and get first 10 customers"
                value={launchStrategy.launchPlan}
                onChange={(e) =>
                  setLaunchStrategy({
                    ...launchStrategy,
                    launchPlan: e.target.value,
                  })
                }
                rows={5}
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
