import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Users, Code, Palette, TrendingUp, ArrowRight } from "lucide-react";
export default function TeamMemberOnboarding({
  currentStep,
  userData,
  onNext,
  onPrevious,
}) {
  const [stepData, setStepData] = useState({});
  const handleInputChange = (field, value) => {
    setStepData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleNext = () => {
    onNext(stepData);
  };
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg">Welcome, Future Team Member!</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              You're about to join an exciting startup team! Let's get you set
              up and ready to collaborate.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="p-3 border rounded-lg">
                <Code className="w-5 h-5 text-accent mx-auto mb-2" />
                <h4>Build Products</h4>
                <p className="text-muted-foreground">
                  Work on cutting-edge projects
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <Palette className="w-5 h-5 text-accent mx-auto mb-2" />
                <h4>Creative Freedom</h4>
                <p className="text-muted-foreground">Shape product direction</p>
              </div>
              <div className="p-3 border rounded-lg">
                <TrendingUp className="w-5 h-5 text-accent mx-auto mb-2" />
                <h4>Equity & Growth</h4>
                <p className="text-muted-foreground">Own part of the company</p>
              </div>
            </div>
          </div>
        );
      case 1:
        const skills = [
          "React",
          "Node.js",
          "Python",
          "UI/UX Design",
          "Marketing",
          "Sales",
          "Data Science",
          "DevOps",
          "Mobile Dev",
        ];
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="mb-2">Your Skills & Experience</h2>
              <p className="text-muted-foreground">
                Help us understand your expertise
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={stepData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={stepData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Primary Skills (select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {skills.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={(stepData.skills || []).includes(skill)}
                      onCheckedChange={(checked) => {
                        const current = stepData.skills || [];
                        if (checked) {
                          handleInputChange("skills", [...current, skill]);
                        } else {
                          handleInputChange(
                            "skills",
                            current.filter((s) => s !== skill),
                          );
                        }
                      }}
                    />
                    <Label htmlFor={skill}>{skill}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level</Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("experience", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                  <SelectItem value="senior">
                    Senior Level (5+ years)
                  </SelectItem>
                  <SelectItem value="expert">
                    Expert Level (10+ years)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center space-y-3">
            <h3>
              {"Step "}
              {currentStep + 1}
              {" Content"}
            </h3>
            <p className="text-muted-foreground">
              This step is being finalized...
            </p>
          </div>
        );
    }
  };
  return (
    <div className="space-y-6">
      {renderStep()}
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
