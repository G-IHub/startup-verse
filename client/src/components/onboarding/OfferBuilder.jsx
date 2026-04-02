import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import {
  DollarSign,
  TrendingUp,
  Heart,
  Sparkles,
  Home,
  GraduationCap,
  Zap,
  Globe,
  Clock,
  Trophy,
  Target,
  Users,
} from "lucide-react";
export default function OfferBuilder({ offer, onChange }) {
  const [whyJoinInput, setWhyJoinInput] = useState("");
  const compensationOptions = [
    {
      value: "equity-focused",
      label: "Equity-Focused",
      description: "Below-market salary + significant equity",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      value: "balanced",
      label: "Balanced",
      description: "Market-rate salary + equity",
      icon: <Target className="w-5 h-5" />,
    },
    {
      value: "cash-focused",
      label: "Cash-Focused",
      description: "Above-market salary + small equity",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];
  const salaryOptions = [
    {
      value: "equity-only",
      label: "Equity Only",
      range: "For co-founder level positions",
    },
    {
      value: "deferred",
      label: "Deferred/Minimal",
      range: "$0-30k + equity",
    },
    {
      value: "startup-friendly",
      label: "Startup-Friendly",
      range: "$30k-60k + equity",
    },
    {
      value: "competitive",
      label: "Competitive",
      range: "$60k-100k + equity",
    },
    {
      value: "market-rate",
      label: "Market-Rate",
      range: "$100k+ + equity",
    },
  ];
  const benefitsOptions = [
    {
      value: "remote-first",
      label: "Remote-first / Flexible location",
      icon: <Globe className="w-4 h-4" />,
    },
    {
      value: "flexible-hours",
      label: "Flexible hours",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      value: "health-insurance",
      label: "Health insurance",
      icon: <Heart className="w-4 h-4" />,
    },
    {
      value: "learning-budget",
      label: "Learning & development budget",
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      value: "conference-budget",
      label: "Conference / travel budget",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      value: "latest-tech",
      label: "Latest tech & tools",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      value: "ownership",
      label: "Ownership & autonomy",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      value: "work-from-home",
      label: "Work from home stipend",
      icon: <Home className="w-4 h-4" />,
    },
  ];
  const handleBenefitToggle = (benefit) => {
    const currentBenefits = offer.benefits || [];
    const newBenefits = currentBenefits.includes(benefit)
      ? currentBenefits.filter((b) => b !== benefit)
      : [...currentBenefits, benefit];
    onChange({
      ...offer,
      benefits: newBenefits,
    });
  };
  const handleAddWhyJoin = () => {
    if (!whyJoinInput.trim()) return;
    const currentReasons = offer.whyJoinUs || [];
    if (currentReasons.length >= 3) return; // Max 3 reasons
    onChange({
      ...offer,
      whyJoinUs: [...currentReasons, whyJoinInput.trim()],
    });
    setWhyJoinInput("");
  };
  const handleRemoveWhyJoin = (index) => {
    const currentReasons = offer.whyJoinUs || [];
    onChange({
      ...offer,
      whyJoinUs: currentReasons.filter((_, i) => i !== index),
    });
  };
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="mb-2">What Can You Offer?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transparency builds trust. Top talent appreciates knowing what to
          expect upfront.
          <span className="block mt-1 text-xs">
            ✨ All fields are optional but recommended
          </span>
        </p>
      </div>
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Compensation Philosophy
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {compensationOptions.map((option) => (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${offer.compensationPhilosophy === option.value ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/30"}`}
              onClick={() => {
                // Apply smart defaults based on compensation philosophy
                const updates = {
                  compensationPhilosophy: option.value,
                };

                // Equity-Focused: High equity, deferred salary
                if (option.value === "equity-focused") {
                  updates.equityMin = offer.equityMin || "2";
                  updates.equityMax = offer.equityMax || "10";
                  updates.salaryApproach = "deferred";
                  updates.salaryMin = "";
                  updates.salaryMax = "";
                }

                // Balanced: Moderate equity, startup-friendly salary with ranges
                if (option.value === "balanced") {
                  updates.equityMin = offer.equityMin || "1";
                  updates.equityMax = offer.equityMax || "5";
                  updates.salaryApproach =
                    offer.salaryApproach || "startup-friendly";
                  updates.salaryMin = offer.salaryMin || "60000";
                  updates.salaryMax = offer.salaryMax || "90000";
                }

                // Cash-Focused: Lower equity, competitive salary with higher ranges
                if (option.value === "cash-focused") {
                  updates.equityMin = offer.equityMin || "0.25";
                  updates.equityMax = offer.equityMax || "2";
                  updates.salaryApproach = "competitive";
                  updates.salaryMin = offer.salaryMin || "100000";
                  updates.salaryMax = offer.salaryMax || "150000";
                }
                onChange({
                  ...offer,
                  ...updates,
                });
              }}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div
                  className={`inline-flex p-2 rounded-full ${offer.compensationPhilosophy === option.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {option.icon}
                </div>
                <div>
                  <p className="mb-1">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Equity Range for Early Team Members
        </Label>
        <p className="text-xs text-muted-foreground -mt-2">
          Varies by role, seniority, and join date
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="Min %"
              value={offer.equityMin || ""}
              onChange={(e) =>
                onChange({
                  ...offer,
                  equityMin: e.target.value,
                })
              }
            />
          </div>
          <span className="text-muted-foreground">to</span>
          <div className="flex-1 space-y-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="Max %"
              value={offer.equityMax || ""}
              onChange={(e) =>
                onChange({
                  ...offer,
                  equityMax: e.target.value,
                })
              }
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Example: 1% - 5% (typical for early team members)
        </p>
      </div>
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Salary Approach
        </Label>
        <div className="space-y-2">
          {salaryOptions.map((option) => (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all ${offer.salaryApproach === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
              onClick={() => {
                // Clear salary ranges if switching to equity-only or deferred
                const shouldClearSalary =
                  option.value === "equity-only" || option.value === "deferred";
                onChange({
                  ...offer,
                  salaryApproach: option.value,
                  ...(shouldClearSalary && {
                    salaryMin: "",
                    salaryMax: "",
                  }),
                });
              }}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${offer.salaryApproach === option.value ? "border-primary bg-primary" : "border-muted-foreground"}`}
                  >
                    {offer.salaryApproach === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.range}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {offer.salaryApproach &&
        offer.salaryApproach !== "equity-only" &&
        offer.salaryApproach !== "deferred" && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salary Range (Optional)
            </Label>
            <p className="text-xs text-muted-foreground -mt-2">
              Provide specific salary ranges for maximum transparency
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="Min (e.g., 50000)"
                  value={offer.salaryMin || ""}
                  onChange={(e) =>
                    onChange({
                      ...offer,
                      salaryMin: e.target.value,
                    })
                  }
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="Max (e.g., 100000)"
                  value={offer.salaryMax || ""}
                  onChange={(e) =>
                    onChange({
                      ...offer,
                      salaryMax: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 If you can't offer specific numbers, the generic range (
              {
                salaryOptions.find((o) => o.value === offer.salaryApproach)
                  ?.range
              }
              ) will be shown
            </p>
          </div>
        )}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Benefits & Perks
        </Label>
        <p className="text-xs text-muted-foreground -mt-2">
          Select all that apply
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {benefitsOptions.map((benefit) => (
            <div
              key={benefit.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${(offer.benefits || []).includes(benefit.value) ? "bg-primary/5 border-primary/30" : "hover:bg-muted/30"}`}
              onClick={() => handleBenefitToggle(benefit.value)}
            >
              <Checkbox
                id={benefit.value}
                checked={(offer.benefits || []).includes(benefit.value)}
                onCheckedChange={() => handleBenefitToggle(benefit.value)}
              />
              <Label
                htmlFor={benefit.value}
                className="flex items-center gap-2 text-sm cursor-pointer flex-1"
              >
                {benefit.icon}
                {benefit.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Why Should Someone Join Your Startup?
        </Label>
        <p className="text-xs text-muted-foreground -mt-2">
          Add up to 3 compelling reasons (e.g., impact, learning, traction)
        </p>
        {(offer.whyJoinUs || []).length > 0 && (
          <div className="space-y-2">
            {(offer.whyJoinUs || []).map((reason, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg"
              >
                <Badge variant="outline" className="mt-0.5 shrink-0">
                  {index + 1}
                </Badge>
                <p className="text-sm flex-1">{reason}</p>
                <button
                  onClick={() => handleRemoveWhyJoin(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {(offer.whyJoinUs || []).length < 3 && (
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Solve climate change affecting 10M people"
              value={whyJoinInput}
              onChange={(e) => setWhyJoinInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddWhyJoin();
                }
              }}
            />
            <button
              onClick={handleAddWhyJoin}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm whitespace-nowrap"
            >
              Add
            </button>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Additional Perks or Details (Optional)
        </Label>
        <Textarea
          placeholder="Any other benefits, perks, or details you'd like to share..."
          value={offer.customPerks || ""}
          onChange={(e) =>
            onChange({
              ...offer,
              customPerks: e.target.value,
            })
          }
          rows={3}
        />
      </div>
      {(offer.compensationPhilosophy ||
        offer.equityMin ||
        offer.salaryApproach ||
        (offer.benefits || []).length > 0) && (
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-primary" />
              <p className="text-sm">
                {"Your startup will display a "}
                <Badge
                  variant="outline"
                  className="ml-1 text-primary border-primary"
                >
                  🏆 Transparent Offer
                </Badge>
                {" badge"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              This makes your startup more attractive to top talent who value
              transparency and clarity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
