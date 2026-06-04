import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  FileText,
  Users,
  Rocket,
  TrendingUp,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Play,
  Map,
  Layers,
  BarChart3,
  Package,
} from "lucide-react";
export default function OnboardingModal({ onClose, onLoadSampleData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      title: "Welcome to StartupVerse!",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div>
            <p className="text-body-large">
              Your complete virtual company operating system
            </p>
            <p className="text-muted-foreground mt-2">
              StartupVerse guides you through building your startup from idea to
              operating company - all in one integrated platform.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              What you'll get:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-muted/50 border border-border/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Map className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm mb-1">6 Guided Stages</h4>
                    <p className="text-xs text-muted-foreground">
                      From idea validation to operations
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/50 border border-border/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm mb-1">50+ Tools</h4>
                    <p className="text-xs text-muted-foreground">
                      Replace expensive SaaS subscriptions
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/50 border border-border/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm mb-1">Progress Tracking</h4>
                    <p className="text-xs text-muted-foreground">
                      Know exactly where you are
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/50 border border-border/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm mb-1">All-in-One Platform</h4>
                    <p className="text-xs text-muted-foreground">
                      Everything you need in one place
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Your Startup Journey",
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Follow a proven 6-stage framework used by successful startups:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">
                    Stage 1: Ideation & Validation
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Validate your idea with 20+ customer interviews before
                    building
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Stage 2: Company Formation</h4>
                  <p className="text-xs text-muted-foreground">
                    Form your legal entity, cap table, and founder agreements
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Stage 3: Team Building</h4>
                  <p className="text-xs text-muted-foreground">
                    Find co-founders and build your core team
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Stage 4: Product Development</h4>
                  <p className="text-xs text-muted-foreground">
                    Build your MVP with roadmaps, sprints, and launch checklist
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Stage 5: Go-to-Market</h4>
                  <p className="text-xs text-muted-foreground">
                    Get your first 100 customers with CRM and sales pipeline
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Stage 6: Operations & Growth</h4>
                  <p className="text-xs text-muted-foreground">
                    Manage finances, budgets, invoices, and OKRs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How It Works",
      icon: Play,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            StartupVerse is designed to guide you step-by-step:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  1
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Complete "Profile Setup"</h4>
                  <p className="text-xs text-muted-foreground">
                    Click "Profile Setup" in the sidebar to add your founder and
                    startup details
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  2
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">
                    Navigate to "Startup Journey"
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Click "Startup Journey" in the sidebar to see your 6-stage
                    roadmap
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  3
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Work Through Each Stage</h4>
                  <p className="text-xs text-muted-foreground">
                    Start with Stage 1 (Ideation) and work sequentially through
                    all 6 stages
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  4
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Track Your Progress</h4>
                  <p className="text-xs text-muted-foreground">
                    Watch your completion % increase as you fill out each
                    section
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border/50 rounded-lg sm:col-span-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  5
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs mb-1">Export Your Data Regularly</h4>
                  <p className="text-xs text-muted-foreground">
                    Go to Settings to backup your progress - it's saved in your
                    browser only
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm">
              <strong>Pro Tip:</strong>
              {' Click "Save Progress" regularly to ensure your work is saved!'}
            </p>
          </div>
        </div>
      ),
    },
  ];
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[16px] border-0 shadow-modal">
        <CardHeader className="border-b relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon className="w-6 h-6 text-primary" />
                {currentStepData.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {"Step "}
                {currentStep + 1}
                {" of "}
                {steps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-4">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all ${idx <= currentStep ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStepData.content}
        </CardContent>
        <div className="border-t p-4 flex items-center justify-between bg-muted/30">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={isFirstStep}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Skip Tutorial
            </Button>
            {!isLastStep ? (
              <Button
                onClick={() =>
                  setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
                }
                className="bg-primary hover:bg-primary/90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-primary hover:bg-primary/90"
              >
                Get Started
                <Play className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
