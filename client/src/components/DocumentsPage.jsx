import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  FileText,
  ArrowRight,
  Rocket,
  Building,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useJourneyStore } from "../state/useJourneyStore";

export default function DocumentsPage({ user, onNavigate }) {
  const hydrate = useJourneyStore((s) => s.hydrate);
  const pitchDraft = useJourneyStore((s) => s.homeUi?.stageDrafts?.pitch_deck);

  useEffect(() => {
    if (user?.id) hydrate(user.id);
  }, [user?.id, hydrate]);

  const hasPitchDeck =
    pitchDraft != null &&
    pitchDraft !== "" &&
    (typeof pitchDraft !== "object" ||
      Object.keys(pitchDraft).length > 0 ||
      (Array.isArray(pitchDraft?.slides) && pitchDraft.slides.length > 0));

  const documents = [
    {
      id: "pitch-deck",
      title: "Investor Pitch Deck",
      description: "Professional 13-slide presentation for fundraising",
      icon: Rocket,
      page: "pitch-deck",
      status: hasPitchDeck ? "In Progress" : "Not Started",
      color: "from-purple-600 to-primary",
      bgColor: "from-purple-50 to-primary/5",
      borderColor: "border-purple-200",
      available: true,
    },
    {
      id: "business-plan",
      title: "Business Plan",
      description: "Comprehensive business plan and strategy document",
      icon: Building,
      page: "business-plan",
      status: "Coming Soon",
      color: "from-blue-600 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      available: false,
    },
    {
      id: "financial-model",
      title: "Financial Model",
      description: "3-5 year financial projections and forecasting",
      icon: TrendingUp,
      page: "financial-model",
      status: "Coming Soon",
      color: "from-green-600 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      available: false,
    },
    {
      id: "team-handbook",
      title: "Team Handbook",
      description: "Company culture, values, and team guidelines",
      icon: Users,
      page: "team-handbook",
      status: "Coming Soon",
      color: "from-orange-600 to-red-600",
      bgColor: "from-orange-50 to-red-50",
      borderColor: "border-orange-200",
      available: false,
    },
  ];
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="mb-1">Documents & Templates</h1>
        <p className="text-muted-foreground">
          Professional documents to help you build and grow your startup
        </p>
      </div>
      <Card
        className={`border-2 ${documents[0].borderColor} bg-gradient-to-br ${documents[0].bgColor} dark:from-purple-950/20 dark:to-background overflow-hidden relative`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-primary/10 rounded-full blur-3xl -z-10" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-6 h-6 text-purple-600" />
                <Badge variant={hasPitchDeck ? "default" : "secondary"}>
                  {documents[0].status}
                </Badge>
              </div>
              <CardTitle className="text-3xl mb-2">
                {documents[0].title}
              </CardTitle>
              <CardDescription className="text-base">
                {documents[0].description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">13 Slides</p>
                <p className="text-xs text-muted-foreground">
                  Complete framework
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">20 Minutes</p>
                <p className="text-xs text-muted-foreground">
                  Average pitch time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur rounded-lg">
              <Rocket className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Investor Ready</p>
                <p className="text-xs text-muted-foreground">
                  Professional format
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => onNavigate("pitch-deck")}
            className={`w-full h-auto py-4 bg-gradient-to-r ${documents[0].color} hover:opacity-90`}
            size="lg"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold">
                  {hasPitchDeck ? "Continue Editing" : "Create Pitch Deck"}
                </p>
                <p className="text-xs opacity-90">
                  {hasPitchDeck
                    ? "Resume your investor presentation"
                    : "Build your investor presentation"}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </div>
          </Button>
          <div className="pt-4 border-t border-purple-200/50">
            <h3 className="font-semibold mb-3">What's Inside:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "Cover & Introduction",
                "Problem Statement",
                "Your Solution",
                "Market Size",
                "Product Demo",
                "Business Model",
                "Traction Metrics",
                "Team & Advisors",
                "Financial Projections",
                "Competition Analysis",
                "Go-to-Market",
                "The Ask",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div>
        <h2 className="text-xl font-semibold mb-4">More Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.slice(1).map((doc) => {
            const Icon = doc.icon;
            return (
              <Card
                key={doc.id}
                className={`border-2 ${doc.borderColor} bg-gradient-to-br ${doc.bgColor} dark:from-${doc.color.split("-")[1]}-950/20 dark:to-background relative overflow-hidden ${!doc.available && "opacity-60"}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${doc.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {doc.title}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {doc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={!doc.available}
                    variant="outline"
                    className="w-full"
                  >
                    {doc.available ? "Get Started" : "Coming Soon"}
                    {doc.available && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Check out our comprehensive pitch deck guide for tips on
                creating an investor-ready presentation.
              </p>
              <Button variant="outline" size="sm">
                View Pitch Deck Guide
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
