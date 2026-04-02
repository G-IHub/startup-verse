import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Briefcase, ArrowRight } from "lucide-react";
export default function FreelancerOnboarding({
  currentStep,
  userData,
  onNext,
  onPrevious,
}) {
  const [stepData, setStepData] = useState({});
  const handleNext = () => {
    onNext({
      name: "Freelancer User",
      email: "freelancer@example.com",
      ...stepData,
    });
  };
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
          <Briefcase className="w-6 h-6 text-accent" />
        </div>
        <h2>Welcome, Future Freelancer!</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ready to offer your skills to growing startups? Let's build your
          freelancer profile and find exciting projects.
        </p>
        <Badge variant="outline">
          {"Freelancer Onboarding - Step "}
          {currentStep + 1}
        </Badge>
      </div>
      <div className="flex justify-between pt-4">
        {currentStep > 0 && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleNext} className="flex items-center gap-2">
          {currentStep === 5 ? "Complete Setup" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
