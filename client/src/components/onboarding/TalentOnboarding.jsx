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
import { Star, Rocket, Target, Heart, ArrowRight } from "lucide-react";
export default function TalentOnboarding({
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
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-accent" />
            </div>
            <h2>Welcome to StartupVerse!</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ready to join innovative startups and build the future? Let's
              create your profile to match you with the perfect opportunities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="p-3 border rounded-lg">
                <Rocket className="w-5 h-5 text-accent mx-auto mb-2" />
                <h4>Find Startups</h4>
                <p className="text-muted-foreground">Browse innovative ideas</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Target className="w-5 h-5 text-accent mx-auto mb-2" />
                <h4>Match Your Skills</h4>
                <p className="text-muted-foreground">
                  Find perfect opportunities
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <Heart className="w-5 h-5 text-accent mx-auto mb-2" />
                <h4>Join & Build</h4>
                <p className="text-muted-foreground">
                  Become part of something great
                </p>
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
          "Product Management",
          "TypeScript",
          "GraphQL",
        ];
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="mb-2">Your Skills & Experience</h2>
              <p className="text-muted-foreground">
                Tell us about your expertise so we can match you with the right
                opportunities
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={stepData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={stepData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Your Primary Role *</Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("primaryRole", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="developer">Developer/Engineer</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="marketer">Marketer</SelectItem>
                  <SelectItem value="product">Product Manager</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="data">Data Scientist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Skills (select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {skills.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      onCheckedChange={(checked) => {
                        const currentSkills = stepData.skills || [];
                        handleInputChange(
                          "skills",
                          checked
                            ? [...currentSkills, skill]
                            : currentSkills.filter((s) => s !== skill),
                        );
                      }}
                    />
                    <label htmlFor={skill} className="text-sm cursor-pointer">
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Select
                onValueChange={(value) =>
                  handleInputChange("experience", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 years</SelectItem>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 2:
        const industries = [
          "HealthTech",
          "EdTech",
          "FinTech",
          "E-commerce",
          "SaaS",
          "CleanTech",
          "AI/ML",
          "Social",
          "Gaming",
        ];
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="mb-2">Your Preferences</h2>
              <p className="text-muted-foreground">
                What kind of startups are you looking for?
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">About You *</Label>
              <Textarea
                id="bio"
                placeholder="Tell founders about your background, what you're passionate about, and what you're looking for..."
                rows={4}
                value={stepData.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Industries of Interest</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {industries.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      onCheckedChange={(checked) => {
                        const currentIndustries = stepData.interests || [];
                        handleInputChange(
                          "interests",
                          checked
                            ? [...currentIndustries, industry]
                            : currentIndustries.filter((i) => i !== industry),
                        );
                      }}
                    />
                    <label
                      htmlFor={industry}
                      className="text-sm cursor-pointer"
                    >
                      {industry}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lookingFor">What I'm Looking For *</Label>
              <Textarea
                id="lookingFor"
                placeholder="e.g., Co-founder role in early-stage startup with equity, or Technical lead position in HealthTech..."
                rows={3}
                value={stepData.lookingFor || ""}
                onChange={(e) =>
                  handleInputChange("lookingFor", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA or Remote"
                  value={stepData.location || ""}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("availability", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="When can you start?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="1-week">In 1 week</SelectItem>
                    <SelectItem value="2-weeks">In 2 weeks</SelectItem>
                    <SelectItem value="1-month">In 1 month</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg">You're All Set! 🎉</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Your profile is complete! You'll now see curated startup matches
              based on your skills and preferences.
            </p>
            <Card className="max-w-md mx-auto">
              <CardContent className="p-3">
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Rocket className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Browse Startups</p>
                      <p className="text-[10px] text-muted-foreground">
                        Discover exciting opportunities
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Show Interest</p>
                      <p className="text-[10px] text-muted-foreground">
                        Connect with founders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Get Matched</p>
                      <p className="text-[10px] text-muted-foreground">
                        Receive invitations from founders
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className="space-y-6">
      {renderStep()}
      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} size="lg">
          {currentStep === 3 ? "Complete Setup" : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
