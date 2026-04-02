import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sparkles,
  X,
  ChevronRight,
  MessageSquare,
  Target,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
export default function Phase3Welcome({ onDismiss, onStartFlow }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to Your Execution Engine!",
      description:
        "Phase 3 is complete! You now have a powerful system to turn your goals into structured outcomes.",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      icon: MessageSquare,
      title: "Describe Goals in Plain English",
      description:
        "Just type what you want to achieve: 'Validate our pricing with 10 customer interviews' - we'll handle the rest!",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: Target,
      title: "Auto-Generated Structure",
      description:
        "Your goal becomes a weekly outcome with 3 milestones and 8-10 tasks - fully customizable!",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: UserPlus,
      title: "Assign Tasks to Your Team",
      description:
        "Every task can be assigned to team members with one click. Track who's doing what!",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];
  const currentStep = steps[step];
  const Icon = currentStep.icon;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary"
                >
                  Phase 3 Complete
                </Badge>
                <Badge variant="secondary">
                  {step + 1}
                  {" of "}
                  {steps.length}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div
            className={`w-20 h-20 rounded-full ${currentStep.bgColor} flex items-center justify-center mx-auto mb-6`}
          >
            <Icon className={`w-10 h-10 ${currentStep.color}`} />
          </div>
          <p className="text-center text-lg text-muted-foreground mb-8">
            {currentStep.description}
          </p>
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${index === step ? "w-8 bg-primary" : index < step ? "w-2 bg-primary/50" : "w-2 bg-border"}`}
              />
            ))}
          </div>
          {step === steps.length - 1 && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-50 dark:from-primary/20 dark:to-purple-950/20 rounded-lg border border-primary/20 mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                What's Included:
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Natural language input</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>AI intent parsing</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Auto-generated milestones</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Smart task creation</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Team assignment</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>20 outcome templates</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Weekly streak tracking</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            {step < steps.length - 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={onDismiss}
                  className="flex-1"
                >
                  Skip Tutorial
                </Button>
                <Button onClick={() => setStep(step + 1)} className="flex-1">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onDismiss}
                  className="flex-1"
                >
                  I'll Explore Later
                </Button>
                <Button
                  onClick={() => {
                    onDismiss();
                    onStartFlow();
                  }}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try It Now!
                </Button>
              </>
            )}
          </div>
          {step === steps.length - 1 && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              💡 Try saying: "Validate our pricing with 10 customer interviews"
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
