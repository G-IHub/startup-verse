import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import ProfileCompletionModal from "../ProfileCompletionModal";
import ProfileCompletionReminder from "../ProfileCompletionReminder";
import OfferDisplay from "../OfferDisplay";
import { toast } from "sonner";
import * as talentApi from "../../utils/api/talentApi";
import * as founderApi from "../../utils/api/founderApi";
import {
  Search,
  Star,
  Heart,
  Briefcase,
  MapPin,
  Users,
  ArrowRight,
  AlertCircle,
  Calendar,
  Sparkles,
  DollarSign,
  Clock,
  TrendingUp,
  Target,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
export default function TalentDashboard({
  user,
  onLogout,
  onUpdateUser,
  onNavigate,
}) {
  const [showProfileModal, setShowProfileModal] = useState(
    !user.onboardingComplete,
  );
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [expressedInterest, setExpressedInterest] = useState([]);
  const [interestMessage, setInterestMessage] = useState("");

  // Backend data state
  const [opportunities, setOpportunities] = useState([]);
  const [matchedOpportunities, setMatchedOpportunities] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [savingItems, setSavingItems] = useState(new Set());

  // Load data from backend on mount
  useEffect(() => {
    loadDashboardData();
  }, [user.id]);
  const loadDashboardData = async () => {
    if (!user.id) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log("🔄 [TalentDashboard] Loading dashboard data...");

      // Load all data in parallel
      const [postsRes, savedRes, applicationsRes] = await Promise.all([
        // Load startup posts (same as Browse Startups page)
        founderApi.getAllPosts(),
        talentApi.getSavedItems(user.id),
        talentApi.getTalentApplications(user.id),
      ]);

      // Process startup posts and calculate match scores
      let startupPosts = postsRes.posts || [];
      if (startupPosts.length > 0 && user.role === "talent" && user.profile) {
        // Calculate match scores for each startup
        const scoredPosts = startupPosts.map((post) => {
          const matchScore = calculateStartupMatchScore(post, user.profile);
          return {
            ...post,
            matchScore,
            match: matchScore,
            // For consistency with display
            postedDate: new Date(post.postedDate || Date.now()),
          };
        });

        // Sort by match score
        scoredPosts.sort((a, b) => b.matchScore - a.matchScore);
        startupPosts = scoredPosts;
        console.log(
          "✅ [TalentDashboard] Calculated match scores for",
          startupPosts.length,
          "startups",
        );
      }
      setMatchedOpportunities(startupPosts);
      setSavedItems(savedRes.savedItems || []);
      setApplications(applicationsRes.applications || []);
      console.log("✅ Talent dashboard data loaded:", {
        startups: startupPosts.length,
        topMatch: startupPosts[0]?.matchScore || 0,
        saved: savedRes.savedItems?.length || 0,
        applications: applicationsRes.applications?.length || 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate how well a startup matches talent's profile
  const calculateStartupMatchScore = (startup, talentProfile) => {
    let score = 0;
    const maxScore = 100;

    // Skills match (40 points max)
    const talentSkills = Array.isArray(talentProfile.skills)
      ? talentProfile.skills
      : [];
    const lookingFor = Array.isArray(startup.lookingFor)
      ? startup.lookingFor
      : [];
    const tags = Array.isArray(startup.tags) ? startup.tags : [];
    if (talentSkills.length > 0 && (lookingFor.length > 0 || tags.length > 0)) {
      const allStartupKeywords = [...lookingFor, ...tags].map((k) =>
        k.toLowerCase(),
      );
      const matchingSkills = talentSkills.filter((skill) =>
        allStartupKeywords.some(
          (keyword) =>
            keyword.includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(keyword),
        ),
      );
      score += Math.min(40, (matchingSkills.length / talentSkills.length) * 40);
    }

    // Industry match (20 points max)
    const talentInterests = Array.isArray(talentProfile.interests)
      ? talentProfile.interests
      : [];
    const industryPrefs = Array.isArray(talentProfile.industryPreferences)
      ? talentProfile.industryPreferences
      : [];
    const allTalentIndustries = [...talentInterests, ...industryPrefs].map(
      (i) => i.toLowerCase(),
    );
    if (startup.industry && allTalentIndustries.length > 0) {
      const startupIndustry = startup.industry.toLowerCase();
      if (
        allTalentIndustries.some(
          (ind) =>
            startupIndustry.includes(ind) || ind.includes(startupIndustry),
        )
      ) {
        score += 20;
      }
    }

    // Location match (10 points max)
    if (talentProfile.location && startup.location) {
      const talentLoc = talentProfile.location.toLowerCase();
      const startupLoc = startup.location.toLowerCase();
      if (
        talentLoc === startupLoc ||
        talentLoc.includes(startupLoc) ||
        startupLoc.includes(talentLoc)
      ) {
        score += 10;
      } else if (
        startupLoc.includes("remote") ||
        talentLoc.includes("remote")
      ) {
        score += 5;
      }
    }

    // Commitment match (10 points max)
    if (talentProfile.preferredCommitment && startup.commitment) {
      const talentCommitment = talentProfile.preferredCommitment.toLowerCase();
      const startupCommitment = startup.commitment.toLowerCase();
      if (
        talentCommitment === startupCommitment ||
        startupCommitment.includes(talentCommitment) ||
        talentCommitment.includes("flexible") ||
        startupCommitment.includes("flexible")
      ) {
        score += 10;
      }
    }

    // Stage preference (10 points max) - favor early stage for growth opportunities
    if (startup.stage) {
      const stage = startup.stage.toLowerCase();
      if (stage.includes("idea") || stage.includes("mvp")) {
        score += 10; // High potential for impact
      } else if (stage.includes("traction") || stage.includes("seed")) {
        score += 8;
      } else {
        score += 5;
      }
    }

    // Recency bonus (10 points max) - favor newly posted opportunities
    if (startup.postedDate) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(startup.postedDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysAgo <= 3) {
        score += 10;
      } else if (daysAgo <= 7) {
        score += 7;
      } else if (daysAgo <= 14) {
        score += 4;
      }
    }

    // Ensure score is between 0 and maxScore
    return Math.min(maxScore, Math.max(0, Math.round(score)));
  };
  const handleProfileComplete = (profileData) => {
    onUpdateUser({
      ...user,
      profile: {
        ...user.profile,
        ...profileData,
      },
      onboardingComplete: true,
    });
    // Reload dashboard data with updated profile
    loadDashboardData();
  };
  const handleExpressInterest = async () => {
    if (!selectedStartup) return;
    if (!interestMessage.trim()) {
      toast.error("Please write a message to express your interest");
      return;
    }
    if (expressedInterest.includes(selectedStartup.id)) {
      toast.info("You have already expressed interest in this startup");
      return;
    }
    setIsSubmittingApplication(true);
    try {
      // Submit application to backend
      const applicationData = {
        startupId: selectedStartup.id.toString(),
        opportunityId: selectedStartup.id.toString(),
        coverLetter: interestMessage,
        portfolio: [], // Could add portfolio items in the future
      };
      const result = await talentApi.submitApplication(
        user.id,
        applicationData,
      );
      console.log("✅ Application submitted to backend:", result);

      // Update local state
      setExpressedInterest([...expressedInterest, selectedStartup.id]);

      // Add to applications list
      const newApplication = {
        id: result.applicationId || Date.now().toString(),
        startupId: selectedStartup.id,
        startupTitle: selectedStartup.title,
        founderName: selectedStartup.founder,
        message: interestMessage,
        coverLetter: interestMessage,
        status: "pending",
        submittedAt: new Date().toISOString(),
        ...selectedStartup,
      };
      setApplications([newApplication, ...applications]);

      // Also save to localStorage for backwards compatibility
      const interests = JSON.parse(
        localStorage.getItem("startupverse_sent_interests") || "[]",
      );
      interests.push({
        id: result.applicationId || Date.now().toString(),
        startupId: selectedStartup.id,
        startupTitle: selectedStartup.title,
        founderName: selectedStartup.founder,
        message: interestMessage,
        sentBy: user.name,
        sentById: user.id,
        sentAt: new Date().toISOString(),
        status: "pending",
      });
      localStorage.setItem(
        "startupverse_sent_interests",
        JSON.stringify(interests),
      );
      toast.success(
        `✉️ Your application has been sent to ${selectedStartup.founder}! They'll be able to view your profile and message.`,
      );
      setInterestMessage("");
      setSelectedStartup(null);
    } catch (error) {
      console.error("❌ Failed to submit application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // Check if an item is saved
  const isSaved = (itemId) => {
    return savedItems.some(
      (item) =>
        item.itemId === itemId.toString() ||
        item.startupId === itemId.toString() ||
        item.id === itemId.toString(),
    );
  };

  // Save/unsave handler
  const handleToggleSave = async (startup, e) => {
    e?.stopPropagation(); // Prevent triggering parent click events

    const itemId = startup.id.toString();
    const isCurrentlySaved = isSaved(itemId);

    // Prevent multiple simultaneous saves
    if (savingItems.has(itemId)) return;

    // Add to saving set
    setSavingItems((prev) => new Set(prev).add(itemId));
    try {
      if (isCurrentlySaved) {
        // Unsave
        await talentApi.removeSavedItem(user.id, "startup", itemId);

        // Remove from savedItems
        setSavedItems((prev) =>
          prev.filter(
            (item) =>
              item.itemId !== itemId &&
              item.startupId !== itemId &&
              item.id !== itemId,
          ),
        );
        console.log("✅ Item unsaved from backend:", itemId);
        toast.success("Removed from saved");
      } else {
        // Save
        const itemData = {
          itemType: "startup",
          itemId: itemId,
          itemData: startup,
        };
        const result = await talentApi.saveItem(user.id, itemData);

        // Add to savedItems
        const newSavedItem = {
          id: result.savedItemId || Date.now().toString(),
          itemId: itemId,
          startupId: itemId,
          itemType: "startup",
          itemData: startup,
          savedAt: new Date().toISOString(),
        };
        setSavedItems((prev) => [newSavedItem, ...prev]);
        console.log("✅ Item saved to backend:", result);
        toast.success("Saved for later!");
      }
    } catch (error) {
      console.error("❌ Failed to toggle save:", error);
      toast.error("Failed to update. Please try again.");
    } finally {
      // Remove from saving set
      setSavingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Get today's date
  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Calculate metrics from backend data
  const newMatches = matchedOpportunities.length;
  const savedOpportunities = savedItems.length;

  // Mock data for fallback when no backend data
  const topMatches = [
    {
      id: 1,
      title: "AI-Powered Healthcare Diagnostics",
      description:
        "Building an AI platform that helps doctors diagnose diseases faster and more accurately using machine learning and medical imaging.",
      founder: "Dr. Sarah Johnson",
      industry: "HealthTech",
      stage: "Idea Stage",
      lookingFor: ["Full-Stack Developer", "ML Engineer", "UX Designer"],
      location: "San Francisco, CA",
      match: 92,
      teamSize: 8,
      funding: "Seed Funded",
      commitment: "Full-time",
      tags: ["AI", "Healthcare", "B2B", "SaaS"],
      posted: "2 days ago",
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      interested: 12,
      offer: {
        compensationPhilosophy: "equity-focused",
        equityMin: "2",
        equityMax: "8",
        salaryApproach: "deferred",
        benefits: [
          "remote-first",
          "flexible-hours",
          "learning-budget",
          "latest-tech",
        ],
        whyJoinUs: [
          "Impact millions of patients worldwide with better diagnostics",
          "Work with cutting-edge AI/ML technology in healthcare",
          "Join a mission-driven team with deep medical expertise",
        ],
      },
    },
    {
      id: 2,
      title: "Next-Gen AI Assistant Platform",
      description:
        "Building enterprise AI assistants that integrate seamlessly with existing workflows. Using advanced LLMs and proprietary training methods to deliver personalized automation at scale.",
      founder: "Michael Zhang",
      industry: "AI Tech",
      stage: "MVP Building",
      lookingFor: ["AI/ML Engineer", "Backend Developer", "DevOps Engineer"],
      location: "Austin, TX",
      match: 88,
      teamSize: 6,
      funding: "Seed Funded",
      commitment: "Full-time",
      tags: ["AI", "Enterprise", "SaaS", "Automation"],
      posted: "3 days ago",
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      interested: 16,
      offer: {
        compensationPhilosophy: "balanced",
        equityMin: "1.5",
        equityMax: "6",
        salaryApproach: "competitive",
        salaryMin: "100000",
        salaryMax: "150000",
        benefits: [
          "remote-first",
          "flexible-hours",
          "health-insurance",
          "learning-budget",
          "latest-tech",
        ],
        whyJoinUs: [
          "Work on cutting-edge AI technology used by Fortune 500 companies",
          "Backed by top-tier VCs with strong AI/ML portfolio",
          "Competitive compensation package with significant equity upside",
        ],
      },
    },
    {
      id: 3,
      title: "Sustainable Fashion Marketplace",
      description:
        "Creating a marketplace that connects eco-conscious consumers with sustainable fashion brands. Focus on transparency and carbon footprint tracking.",
      founder: "Maya Patel",
      industry: "E-commerce",
      stage: "MVP Building",
      lookingFor: ["Backend Developer", "Marketing Lead", "Operations Manager"],
      location: "New York, NY",
      match: 85,
      teamSize: 5,
      funding: "Pre-Seed",
      commitment: "Part-time to Full-time",
      tags: ["Sustainability", "Fashion", "E-commerce", "B2C"],
      posted: "5 days ago",
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      interested: 8,
      offer: {
        compensationPhilosophy: "balanced",
        equityMin: "1",
        equityMax: "5",
        salaryApproach: "startup-friendly",
        salaryMin: "50000",
        salaryMax: "80000",
        benefits: ["remote-first", "flexible-hours", "work-from-home"],
        whyJoinUs: [
          "Help combat climate change through sustainable fashion",
          "Growing market with $15B+ opportunity",
          "Already have partnerships with 20+ eco-brands",
        ],
        customPerks: "4-day work week option after MVP launch",
      },
    },
    {
      id: 4,
      title: "EdTech for Coding Education",
      description:
        "Interactive platform teaching kids age 8-16 how to code through game-based learning. Already have 500 beta users.",
      founder: "Alex Chen",
      industry: "EdTech",
      stage: "Early Traction",
      lookingFor: ["Frontend Developer", "Product Designer", "Growth Marketer"],
      location: "Remote",
      match: 78,
      teamSize: 12,
      funding: "Series A",
      commitment: "Full-time",
      tags: ["EdTech", "Kids", "Gaming", "SaaS"],
      posted: "7 days ago",
      postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      interested: 24,
      offer: {
        compensationPhilosophy: "balanced",
        equityMin: "0.5",
        equityMax: "4",
        salaryApproach: "competitive",
        salaryMin: "90000",
        salaryMax: "140000",
        benefits: [
          "remote-first",
          "flexible-hours",
          "health-insurance",
          "learning-budget",
          "conference-budget",
        ],
        whyJoinUs: [
          "500 active users growing 40% month-over-month",
          "Recently accepted into Y Combinator",
          "Shape the future of how millions of kids learn to code",
        ],
      },
    },
  ];

  // Use matched opportunities from backend, or fall back to mock data if empty
  const displayedMatches =
    matchedOpportunities.length > 0
      ? matchedOpportunities.slice(0, 3)
      : topMatches;
  const metrics = [
    {
      label: "New Matches",
      value: newMatches,
      icon: Star,
      sublabel: "Startups for you",
      color: "primary",
    },
    {
      label: "Saved",
      value: savedOpportunities,
      icon: Heart,
      sublabel: "Opportunities",
      color: "primary",
    },
  ];
  return (
    <div className="p-2 md:p-3 space-y-2 md:space-y-2.5">
      {showProfileModal && !user.onboardingComplete && (
        <ProfileCompletionModal
          role={user.role}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-1.5">
        <div className="flex-shrink-0">
          <h1 className="mb-0 text-sm md:text-base">
            {"Welcome back, "}
            {user.name}
          </h1>
          <p className="text-muted-foreground text-[9px]">{todayFormatted}</p>
        </div>
        <div className="flex gap-1 lg:ml-auto">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-1 flex items-center gap-1">
                  <div className="w-4 h-4 bg-primary/10 dark:bg-primary/20 rounded flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">
                      {metric.value}
                    </p>
                    <p className="text-[8px] text-muted-foreground leading-tight mt-0.5">
                      {metric.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {user.onboardingComplete && (
        <ProfileCompletionReminder
          user={user}
          onNavigateToProfile={() => onNavigate?.("settings")}
        />
      )}
      {!user.onboardingComplete && (
        <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-1.5">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900 dark:text-orange-100 text-[10px]">
                  Complete your profile to find opportunities
                </p>
                <p className="text-[9px] text-orange-700 dark:text-orange-300 mt-0.5">
                  Add your skills and experience to get matched with the best
                  startups.
                </p>
                <Button
                  size="sm"
                  className="mt-1 h-5 text-[9px] px-2"
                  onClick={() => setShowProfileModal(true)}
                >
                  Complete Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="bg-gradient-to-r from-[#3A5AFE] to-[#304FFE] border-none text-white overflow-hidden relative shadow-lg">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
        <CardContent className="p-3 md:p-4 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex-1 space-y-1">
              <div>
                <h2 className="text-white mb-0.5 text-sm">
                  Find Your Perfect Startup
                </h2>
                <p className="text-white/90 max-w-xl text-[10px]">
                  Discover startups that match your skills, interests, and
                  career goals. Connect with founders and join exciting teams.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-white !text-black hover:bg-white/90 shadow-lg hover:shadow-xl transition-all text-[10px] px-3 py-1.5 h-auto font-semibold"
              onClick={() => onNavigate?.("team-matching")}
            >
              <Search className="w-3 h-3 mr-1 text-black" />
              Browse Startups
              <ArrowRight className="w-3 h-3 ml-1 text-black" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {user.onboardingComplete && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Top Matches for You
            </CardTitle>
            <CardDescription>Startups looking for your skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayedMatches.map((startup) => (
                <div
                  key={startup.id}
                  className="p-6 border rounded-xl hover:shadow-lg transition-all hover:border-primary/50 bg-card flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {startup.title
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 line-clamp-2">
                          {startup.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {"by "}
                          {startup.founder}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-lg px-3 py-2 text-center">
                        <span className="text-xl font-semibold text-primary">
                          {startup.match}%
                        </span>
                        <p className="text-xs text-muted-foreground">Match</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {startup.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      <Briefcase className="w-3 h-3 mr-1" />
                      {startup.lookingFor.join(", ")}
                    </Badge>
                    <Badge variant="outline">{startup.industry}</Badge>
                  </div>
                  <div className="border-t" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Stage</p>
                        <p className="font-medium truncate">{startup.stage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Funding</p>
                        <p className="font-medium truncate">
                          {startup.funding}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Team Size
                        </p>
                        <p className="font-medium">
                          {startup.teamSize}
                          {" members"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Location
                        </p>
                        <p className="font-medium truncate">
                          {startup.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Equity Offer
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {startup.offer.equityMin}-{startup.offer.equityMax}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Commitment
                        </p>
                        <p className="text-sm font-semibold">
                          {startup.commitment}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {"Posted "}
                        {startup.posted}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => handleToggleSave(startup, e)}
                      disabled={savingItems.has(startup.id.toString())}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${isSaved(startup.id.toString()) ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                      />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => setSelectedStartup(startup)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={(e) => handleToggleSave(startup, e)}
                      disabled={savingItems.has(startup.id.toString())}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${isSaved(startup.id.toString()) ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onNavigate?.("team-matching")}
            >
              View All Matches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
      {user.onboardingComplete && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Boost Your Profile
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Add a portfolio or project samples to stand out to founders.
                  Profiles with work examples get 3x more messages!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={selectedStartup !== null}
        onOpenChange={() => {
          setSelectedStartup(null);
          setInterestMessage("");
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {selectedStartup && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4 pr-8">
                  <Avatar className="w-16 h-16 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedStartup.title
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl mb-2 pr-0">
                      {selectedStartup.title}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {"by "}
                      {selectedStartup.founder}
                      {" • "}
                      {selectedStartup.posted}
                    </DialogDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-semibold text-primary">
                          {selectedStartup.match}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Match
                        </span>
                      </div>
                      <Badge variant="outline">
                        {selectedStartup.industry}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="pb-4 border-b">
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedStartup.description}
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStartup.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2 min-w-0">
                    <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <p className="font-medium break-words">
                        {selectedStartup.stage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium break-words">
                        {selectedStartup.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        Commitment
                      </p>
                      <p className="font-medium break-words">
                        {selectedStartup.commitment}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        Interested
                      </p>
                      <p className="font-medium">
                        {selectedStartup.interested}
                        {" people"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Looking for:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStartup.lookingFor.map((role, idx) => (
                      <Badge key={idx} className="text-sm py-1.5 px-3">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedStartup.offer && (
                  <div className="w-full overflow-hidden">
                    <OfferDisplay offer={selectedStartup.offer} />
                  </div>
                )}
                {!expressedInterest.includes(selectedStartup.id) && (
                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Why are you interested?
                      </p>
                      <Textarea
                        placeholder={`Tell ${selectedStartup.founder} about your background, what excites you about this idea, and what value you can bring to the team...`}
                        rows={5}
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        className="resize-none"
                      />
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleExpressInterest}
                      disabled={
                        !interestMessage.trim() || isSubmittingApplication
                      }
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isSubmittingApplication ? "Sending..." : "Send Interest"}
                    </Button>
                  </div>
                )}
                {expressedInterest.includes(selectedStartup.id) && (
                  <div className="pt-4 border-t">
                    <Button className="w-full" size="lg" disabled={true}>
                      <Target className="w-5 h-5 mr-2" />
                      Interest Expressed
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
