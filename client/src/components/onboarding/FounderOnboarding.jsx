import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Rocket, Users, Target, Lightbulb, ArrowRight } from "lucide-react";
import OfferBuilder from "./OfferBuilder";
export default function FounderOnboarding({
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
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Rocket className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-lg">Welcome, Future Founder!</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Ready to turn your vision into reality? Let's build your startup
              profile and connect you with the perfect team, mentors, and
              investors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
              <div className="p-2.5 border rounded-lg">
                <Users className="w-5 h-5 text-accent mx-auto mb-1.5" />
                <h4 className="text-sm">Find Co-founders</h4>
                <p className="text-muted-foreground text-[10px]">
                  Match with skilled teammates
                </p>
              </div>
              <div className="p-2.5 border rounded-lg">
                <Target className="w-5 h-5 text-accent mx-auto mb-1.5" />
                <h4 className="text-sm">Get Mentorship</h4>
                <p className="text-muted-foreground text-[10px]">
                  Learn from experienced entrepreneurs
                </p>
              </div>
              <div className="p-2.5 border rounded-lg">
                <Lightbulb className="w-5 h-5 text-accent mx-auto mb-1.5" />
                <h4 className="text-sm">Secure Funding</h4>
                <p className="text-muted-foreground text-[10px]">
                  Connect with investors
                </p>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            <div className="text-center mb-3 md:mb-4">
              <h2 className="mb-1.5 px-4 text-base">
                Tell us about your startup
              </h2>
              <p className="text-muted-foreground px-4 text-sm">
                Help us understand your vision
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startupName" className="text-xs">
                  Startup Name
                </Label>
                <Input
                  id="startupName"
                  placeholder="Your startup name"
                  value={stepData.startupName || ""}
                  onChange={(e) =>
                    handleInputChange("startupName", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline" className="text-xs">
                  Tagline
                </Label>
                <Input
                  id="tagline"
                  placeholder="Brief description in one line"
                  value={stepData.tagline || ""}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">
                Startup Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your startup, the problem you're solving, and your solution"
                value={stepData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="founderName" className="text-xs">
                  Your Name
                </Label>
                <Input
                  id="founderName"
                  placeholder="Full name"
                  value={stepData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={stepData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        const industries = [
          "AgriTech",
          "AI/ML",
          "Automotive/Mobility",
          "BioTech",
          "CleanTech/Climate",
          "Construction Tech",
          "CyberSecurity",
          "DeepTech",
          "E-commerce",
          "EdTech",
          "Energy",
          "Entertainment/Media",
          "Fashion/Beauty",
          "FinTech",
          "FoodTech",
          "Gaming",
          "GovTech",
          "Hardware",
          "HealthTech",
          "HR Tech",
          "InsurTech",
          "IoT",
          "LegalTech",
          "Logistics/Supply Chain",
          "Marketplace",
          "MarTech",
          "PropTech",
          "RegTech",
          "RetailTech",
          "SaaS",
          "Social Media",
          "SpaceTech",
          "TravelTech",
          "Web3/Blockchain",
          "Other",
        ];
        return (
          <div className="space-y-4">
            <div className="text-center mb-4 md:mb-6">
              <h2 className="mb-2 px-4">Industry & Progress</h2>
              <p className="text-muted-foreground px-4">
                Tell us about your startup's current state
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Industry Focus</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("industry", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Do you have a validated problem/idea?</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("hasValidatedIdea", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">
                      Yes - I've validated the problem with potential customers
                    </SelectItem>
                    <SelectItem value="no">
                      No - Still exploring ideas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Do you have an MVP or prototype?</Label>
                <Select
                  onValueChange={(value) => handleInputChange("hasMVP", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">
                      Yes - I have a working MVP/prototype
                    </SelectItem>
                    <SelectItem value="in-progress">
                      In progress - Currently building
                    </SelectItem>
                    <SelectItem value="no">
                      No - Haven't started building yet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Do you have any customers or users?</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("hasCustomers", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes-paying">
                      Yes - I have paying customers
                    </SelectItem>
                    <SelectItem value="yes-users">
                      Yes - I have active users (not paying yet)
                    </SelectItem>
                    <SelectItem value="no">
                      No - No customers/users yet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current team size (including you)</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("currentTeamSize", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Just me (solo founder)</SelectItem>
                    <SelectItem value="2-3">2-3 people</SelectItem>
                    <SelectItem value="4-5">4-5 people</SelectItem>
                    <SelectItem value="6-10">6-10 people</SelectItem>
                    <SelectItem value="10+">10+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly revenue (if any)</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("monthlyRevenue", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No revenue yet</SelectItem>
                    <SelectItem value="under-1k">Under $1K</SelectItem>
                    <SelectItem value="1k-10k">$1K - $10K</SelectItem>
                    <SelectItem value="10k-50k">$10K - $50K</SelectItem>
                    <SelectItem value="50k+">$50K+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <Label>Target Audience</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  "B2B",
                  "B2C",
                  "Enterprise",
                  "SMB",
                  "Consumers",
                  "Students",
                  "Professionals",
                  "Other",
                ].map((audience) => (
                  <div key={audience} className="flex items-center space-x-2">
                    <Checkbox
                      id={audience}
                      checked={(stepData.targetAudience || []).includes(
                        audience,
                      )}
                      onCheckedChange={(checked) => {
                        const current = stepData.targetAudience || [];
                        if (checked) {
                          handleInputChange("targetAudience", [
                            ...current,
                            audience,
                          ]);
                        } else {
                          handleInputChange(
                            "targetAudience",
                            current.filter((a) => a !== audience),
                          );
                        }
                      }}
                    />
                    <Label htmlFor={audience} className="text-sm">
                      {audience}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        const roles = [
          "CTO",
          "CMO",
          "CPO",
          "CFO",
          "Head of Sales",
          "Head of Marketing",
          "Developer",
          "Designer",
          "Data Scientist",
        ];
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="mb-2">Team Building</h2>
              <p className="text-muted-foreground">
                What roles are you looking to fill?
              </p>
            </div>
            <div className="space-y-3">
              <Label>Roles Needed (select all that apply)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {roles.map((role) => (
                  <Card
                    key={role}
                    className={`cursor-pointer transition-all ${(stepData.neededRoles || []).includes(role) ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => {
                      const current = stepData.neededRoles || [];
                      if (current.includes(role)) {
                        handleInputChange(
                          "neededRoles",
                          current.filter((r) => r !== role),
                        );
                      } else {
                        handleInputChange("neededRoles", [...current, role]);
                      }
                    }}
                  >
                    <CardContent className="p-3 text-center">
                      <p>{role}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Team Size Goal</Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("teamSizeGoal", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ideal team size in 6 months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-5">2-5 people</SelectItem>
                  <SelectItem value="6-10">6-10 people</SelectItem>
                  <SelectItem value="11-20">11-20 people</SelectItem>
                  <SelectItem value="20+">20+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 4:
        return (
          <OfferBuilder
            offer={stepData.offer || {}}
            onChange={(offer) => handleInputChange("offer", offer)}
          />
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="mb-2">Goals & Vision</h2>
              <p className="text-muted-foreground">
                Share your aspirations and timeline
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>6-Month Goal</Label>
                <Textarea
                  placeholder="What do you want to achieve in the next 6 months?"
                  value={stepData.sixMonthGoal || ""}
                  onChange={(e) =>
                    handleInputChange("sixMonthGoal", e.target.value)
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Funding Goals</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("fundingGoal", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How much funding are you seeking?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bootstrapped">
                      Bootstrapped (no funding needed)
                    </SelectItem>
                    <SelectItem value="under-50k">Under $50K</SelectItem>
                    <SelectItem value="50k-250k">$50K - $250K</SelectItem>
                    <SelectItem value="250k-1m">$250K - $1M</SelectItem>
                    <SelectItem value="1m-plus">$1M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label>Areas where you need help</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Product Development",
                    "Marketing",
                    "Sales",
                    "Fundraising",
                    "Legal",
                    "Operations",
                    "Hiring",
                    "Strategy",
                  ].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={(stepData.helpAreas || []).includes(area)}
                        onCheckedChange={(checked) => {
                          const current = stepData.helpAreas || [];
                          if (checked) {
                            handleInputChange("helpAreas", [...current, area]);
                          } else {
                            handleInputChange(
                              "helpAreas",
                              current.filter((a) => a !== area),
                            );
                          }
                        }}
                      />
                      <Label htmlFor={area} className="text-sm">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h3 className="mb-2">🎉 You're Almost Ready!</h3>
                <p className="text-muted-foreground mb-3">
                  Complete your onboarding to access your founder dashboard with
                  AI-powered tools, team matching, and investor discovery.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Smart Team Matching</Badge>
                  <Badge variant="secondary">Virtual Office</Badge>
                  <Badge variant="secondary">Video Calls & Meetings</Badge>
                  <Badge variant="secondary">Team Management</Badge>
                  <Badge variant="secondary">Task Management</Badge>
                  <Badge variant="secondary">Messaging</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="mb-2">Complete Your Profile</h2>
              <p className="text-muted-foreground">
                Final touches to make you discoverable
              </p>
            </div>
            <div className="space-y-3">
              <Label>Profile Picture</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleInputChange("profilePicture", e.target.files?.[0])
                }
              />
            </div>
            <div className="space-y-3">
              <Label>LinkedIn Profile</Label>
              <Input
                placeholder="https://www.linkedin.com/in/your-profile"
                value={stepData.linkedIn || ""}
                onChange={(e) => handleInputChange("linkedIn", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Website</Label>
              <Input
                placeholder="https://www.yourstartup.com"
                value={stepData.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleInputChange("logo", e.target.files?.[0])}
              />
            </div>
          </div>
        );
      default:
        return <div>Invalid step</div>;
    }
  };
  return (
    <div className="space-y-6">
      {renderStep()}
      <div className="flex justify-between pt-4">
        {currentStep > 0 && (
          <Button variant="outline" onClick={onPrevious} size="sm">
            Previous
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleNext}
          className="flex items-center gap-2"
          size="sm"
        >
          {currentStep === 6 ? "Complete Setup" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
