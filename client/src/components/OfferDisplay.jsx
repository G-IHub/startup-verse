import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Trophy,
  Sparkles,
} from "lucide-react";
export default function OfferDisplay({ offer, compact = false }) {
  const getSalaryLabel = (approach, salaryMin, salaryMax) => {
    // If actual salary range provided, show it
    if (salaryMin && salaryMax) {
      const minFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(parseInt(salaryMin));
      const maxFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(parseInt(salaryMax));
      return `${minFormatted} - ${maxFormatted} + equity`;
    }

    // Otherwise show generic approach labels
    switch (approach) {
      case "equity-only":
        return "Equity Only";
      case "deferred":
        return "Deferred (pay when funded)";
      case "startup-friendly":
        return "Startup-friendly salary + equity";
      case "competitive":
        return "Competitive market rate + equity";
      case "market-rate":
        return "Market rate + equity";
      default:
        return null;
    }
  };
  const getCompensationLabel = (philosophy) => {
    switch (philosophy) {
      case "equity-focused":
        return "Equity-Focused";
      case "balanced":
        return "Balanced";
      case "cash-focused":
        return "Cash-Focused";
      default:
        return null;
    }
  };
  const getBenefitLabel = (benefit) => {
    switch (benefit) {
      case "remote-first":
        return "Remote-first";
      case "flexible-hours":
        return "Flexible hours";
      case "health-insurance":
        return "Health insurance";
      case "learning-budget":
        return "Learning budget";
      case "conference-budget":
        return "Conference budget";
      case "latest-tech":
        return "Latest tech & tools";
      case "ownership":
        return "Ownership & autonomy";
      case "work-from-home":
        return "WFH stipend";
      default:
        return benefit;
    }
  };
  const hasAnyOffer =
    offer.compensationPhilosophy ||
    offer.equityMin ||
    offer.salaryApproach ||
    (offer.benefits && offer.benefits.length > 0) ||
    (offer.whyJoinUs && offer.whyJoinUs.length > 0);
  if (!hasAnyOffer) return null;
  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-2 mb-2">
            <Trophy className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs">What We Offer</p>
                <Badge
                  variant="outline"
                  className="text-xs text-primary border-primary"
                >
                  Transparent Offer
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {offer.equityMin && offer.equityMax && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {"Equity: "}
                      {offer.equityMin}
                      {"% - "}
                      {offer.equityMax}%
                    </span>
                  </div>
                )}
                {offer.salaryApproach && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      {getSalaryLabel(
                        offer.salaryApproach,
                        offer.salaryMin,
                        offer.salaryMax,
                      )}
                    </span>
                  </div>
                )}
                {offer.benefits && offer.benefits.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {offer.benefits.length}
                      {" perks including "}
                      {getBenefitLabel(offer.benefits[0])}
                    </span>
                    {offer.benefits.length > 1 && (
                      <span>
                        +{offer.benefits.length - 1}
                        {" more"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-primary" />
          <h4>What We Offer</h4>
          <Badge
            variant="outline"
            className="ml-auto text-primary border-primary"
          >
            Transparent Offer
          </Badge>
        </div>
        <div className="space-y-3">
          {offer.compensationPhilosophy && (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Compensation Approach
                </p>
                <p className="text-sm">
                  {getCompensationLabel(offer.compensationPhilosophy)}
                </p>
              </div>
            </div>
          )}
          {offer.equityMin && offer.equityMax && (
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Equity Range</p>
                <p className="text-sm">
                  {offer.equityMin}
                  {"% - "}
                  {offer.equityMax}% (varies by role)
                </p>
              </div>
            </div>
          )}
          {offer.salaryApproach && (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Salary</p>
                <p className="text-sm">
                  {getSalaryLabel(
                    offer.salaryApproach,
                    offer.salaryMin,
                    offer.salaryMax,
                  )}
                </p>
              </div>
            </div>
          )}
          {offer.benefits && offer.benefits.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Benefits & Perks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {offer.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-xs bg-background/80 px-2 py-1 rounded-md border"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{getBenefitLabel(benefit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {offer.whyJoinUs && offer.whyJoinUs.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Why Join Us</p>
              <ul className="space-y-1">
                {offer.whyJoinUs.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {offer.customPerks && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Additional Perks
              </p>
              <p className="text-sm">{offer.customPerks}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
