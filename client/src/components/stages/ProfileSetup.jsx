import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  User,
  Building,
  Target,
  Users,
  Linkedin,
  Globe,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { HelpTooltip } from "../ui/help-tooltip";
import { useAuth } from "../../contexts/AuthContext";
import {
  useHydrateStageDraft,
  persistStageDraft,
} from "../../hooks/useStageDraftFromJourney";
import { useJourneyStore } from "../../state/useJourneyStore";
export default function ProfileSetup() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({});
  const [activeTab, setActiveTab] = useState("startup");
  useHydrateStageDraft(user, "founder_profile", (raw) => {
    if (!raw || typeof raw !== "object") return;
    setProfileData(raw);
  });
  const handleSave = () => {
    persistStageDraft("founder_profile", profileData);

    // Check if profile is complete
    const completion = getCompletionPercentage();

    const journeyProgress = {
      profileSetup: {
        status: completion === 100 ? "completed" : "in-progress",
        progress: completion,
        lastSaved: new Date().toISOString(),
        ...(completion === 100 ? { completedAt: new Date().toISOString() } : {}),
      },
    };
    useJourneyStore.getState().scheduleHomeUiPersist({
      founderJourneyProgressOverlay: journeyProgress,
    });
    if (completion === 100) {
      toast.success("🎉 Profile setup complete! Stage 0 finished.");
    } else {
      toast.success("Profile saved successfully!");
    }
  };
  const handleChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const industries = [
    "AI/ML",
    "FinTech",
    "HealthTech",
    "EdTech",
    "E-commerce",
    "SaaS",
    "Hardware",
    "Gaming",
    "Social Media",
    "Climate Tech",
    "Other",
  ];
  const stages = [
    "Idea Stage",
    "MVP Development",
    "Beta Testing",
    "Pre-Revenue",
    "Early Revenue",
    "Scaling",
  ];
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
  const getCompletionPercentage = () => {
    const fields = [
      profileData.startupName,
      profileData.description,
      profileData.industry,
      profileData.stage,
      profileData.founderName,
      profileData.sixMonthGoal,
    ];
    const completed = fields.filter((f) => f && f.length > 0).length;
    return Math.round((completed / fields.length) * 100);
  };
  const completion = getCompletionPercentage();
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Founder & Startup Profile
            <HelpTooltip content="Complete your founder and startup profile to unlock team matching, investor discovery, and personalized recommendations." />
          </h2>
          <p className="text-muted-foreground">
            Tell us about yourself and your startup
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Badge variant={completion === 100 ? "default" : "outline"}>
              {completion}% Complete
            </Badge>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>
      </div>
      {completion < 100 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm">
                  <strong>
                    Complete your profile to unlock full platform access
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Team matching, investor connections, and mentor discovery
                  require a complete profile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="startup">
            <Building className="w-4 h-4 mr-2" />
            Startup
          </TabsTrigger>
          <TabsTrigger value="founder">
            <User className="w-4 h-4 mr-2" />
            Founder
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="w-4 h-4 mr-2" />
            Goals
          </TabsTrigger>
        </TabsList>
        <TabsContent value="startup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Startup Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startupName">Startup Name *</Label>
                  <Input
                    id="startupName"
                    placeholder="Your startup name"
                    value={profileData.startupName || ""}
                    onChange={(e) =>
                      handleChange("startupName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="Brief one-liner"
                    value={profileData.tagline || ""}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your startup, the problem you're solving, and your solution"
                  value={profileData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Select
                    value={profileData.industry}
                    onValueChange={(value) => handleChange("industry", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
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
                  <Label>Current Stage *</Label>
                  <Select
                    value={profileData.stage}
                    onValueChange={(value) => handleChange("stage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
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
                        checked={(profileData.targetAudience || []).includes(
                          audience,
                        )}
                        onCheckedChange={(checked) => {
                          const current = profileData.targetAudience || [];
                          if (checked) {
                            handleChange("targetAudience", [
                              ...current,
                              audience,
                            ]);
                          } else {
                            handleChange(
                              "targetAudience",
                              current.filter((a) => a !== audience),
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={audience}
                        className="text-sm cursor-pointer"
                      >
                        {audience}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="founder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Founder Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="founderName">Your Name *</Label>
                  <Input
                    id="founderName"
                    placeholder="Full name"
                    value={profileData.founderName || ""}
                    onChange={(e) =>
                      handleChange("founderName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founderEmail">Email *</Label>
                  <Input
                    id="founderEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={profileData.founderEmail || ""}
                    onChange={(e) =>
                      handleChange("founderEmail", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">
                  <Linkedin className="w-4 h-4 inline mr-1" />
                  LinkedIn Profile (optional)
                </Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profileData.linkedin || ""}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Personal Website (optional)
                </Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={profileData.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
              <div className="space-y-3 pt-4 border-t">
                <Label>Profile Visibility</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publicProfile"
                      checked={profileData.publicProfile || false}
                      onCheckedChange={(checked) =>
                        handleChange("publicProfile", checked)
                      }
                    />
                    <Label htmlFor="publicProfile" className="cursor-pointer">
                      Make my profile discoverable by potential co-founders
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mentorMatch"
                      checked={profileData.mentorMatch || false}
                      onCheckedChange={(checked) =>
                        handleChange("mentorMatch", checked)
                      }
                    />
                    <Label htmlFor="mentorMatch" className="cursor-pointer">
                      I'm interested in mentor matching
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="investorMatch"
                      checked={profileData.investorMatch || false}
                      onCheckedChange={(checked) =>
                        handleChange("investorMatch", checked)
                      }
                    />
                    <Label htmlFor="investorMatch" className="cursor-pointer">
                      I'm ready to connect with investors
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Building Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Roles Needed (select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <Card
                      key={role}
                      className={`cursor-pointer transition-all ${(profileData.neededRoles || []).includes(role) ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => {
                        const current = profileData.neededRoles || [];
                        if (current.includes(role)) {
                          handleChange(
                            "neededRoles",
                            current.filter((r) => r !== role),
                          );
                        } else {
                          handleChange("neededRoles", [...current, role]);
                        }
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <p className="text-sm">{role}</p>
                        {(profileData.neededRoles || []).includes(role) && (
                          <CheckCircle2 className="w-4 h-4 text-primary mx-auto mt-1" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Team Size Goal</Label>
                <Select
                  value={profileData.teamSizeGoal}
                  onValueChange={(value) => handleChange("teamSizeGoal", value)}
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Vision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sixMonthGoal">6-Month Goal *</Label>
                <Textarea
                  id="sixMonthGoal"
                  placeholder="What do you want to achieve in the next 6 months?"
                  value={profileData.sixMonthGoal || ""}
                  onChange={(e) => handleChange("sixMonthGoal", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Funding Goals</Label>
                <Select
                  value={profileData.fundingGoal}
                  onValueChange={(value) => handleChange("fundingGoal", value)}
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
              <div className="space-y-3">
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
                        checked={(profileData.helpAreas || []).includes(area)}
                        onCheckedChange={(checked) => {
                          const current = profileData.helpAreas || [];
                          if (checked) {
                            handleChange("helpAreas", [...current, area]);
                          } else {
                            handleChange(
                              "helpAreas",
                              current.filter((a) => a !== area),
                            );
                          }
                        }}
                      />
                      <Label htmlFor={area} className="text-sm cursor-pointer">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="sticky bottom-6 flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
