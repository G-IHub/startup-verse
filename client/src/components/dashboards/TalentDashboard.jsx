import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import ProfileCompletionModal from "../ProfileCompletionModal";
import OfferDisplay from "../OfferDisplay";
import { toast } from "sonner";
import { getTalentProfileCompletionPercent } from "../../utils/talentProfileCompletion";
import { TALENT_ACTIONS_MIN_COMPLETION } from "../../constants/talentProfile.js";
import * as talentApi from "../../utils/api/talentApi";
import * as founderApi from "../../utils/api/founderApi";
import {
  Star,
  Heart,
  MapPin,
  Users,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Send,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const FILTER_GROUPS = [
  { key: "stage", label: "Stage" },
  { key: "funding", label: "Funding" },
  { key: "commitment", label: "Commitment Type" },
  { key: "equity", label: "Equity Range" },
  { key: "location", label: "Location" },
  { key: "teamSize", label: "Team Size" },
];

const FILTER_DEFAULTS = {
  stage: [],
  funding: [],
  commitment: [],
  equity: [],
  location: [],
  teamSize: [],
};

function toNumber(value) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toRelativePosted(postedDate, fallbackPosted) {
  if (fallbackPosted) return fallbackPosted;
  if (!postedDate) return "Just now";
  const ageInDays = Math.floor(
    (Date.now() - new Date(postedDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (ageInDays <= 0) return "Today";
  if (ageInDays === 1) return "1 day ago";
  return `${ageInDays} days ago`;
}

function getAvatarTone(companyName) {
  const toneClasses = [
    "bg-slate-100 text-slate-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const hash = companyName
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return toneClasses[Math.abs(hash) % toneClasses.length];
}

function getInitials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truncateDescription(text) {
  if (!text) return "";
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function getEquityRange(startup) {
  const equityMin = toNumber(startup?.offer?.equityMin);
  const equityMax = toNumber(startup?.offer?.equityMax);
  if (equityMin == null || equityMax == null) return null;
  return {
    min: equityMin,
    max: equityMax,
    label: `${equityMin}-${equityMax}%`,
    midpoint: (equityMin + equityMax) / 2,
  };
}

function getEquityBucket(equityRange) {
  if (!equityRange) return "Not specified";
  if (equityRange.max <= 2) return "0-2%";
  if (equityRange.max <= 5) return "2-5%";
  if (equityRange.max <= 10) return "5-10%";
  return "10%+";
}

function getTeamSizeBucket(teamSize) {
  if (!teamSize) return "Unknown";
  if (teamSize <= 5) return "1-5";
  if (teamSize <= 10) return "6-10";
  if (teamSize <= 20) return "11-20";
  return "21+";
}

function getMatchStyle(score) {
  if (score >= 80) {
    return "bg-green-100 text-green-700 border border-green-200";
  }
  if (score >= 60) {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }
  return "bg-red-100 text-red-700 border border-red-200";
}

export default function TalentDashboard({
  user,
  onUpdateUser,
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const talentCompletion = getTalentProfileCompletionPercent(user);
  const canUsePrimaryTalentActions =
    talentCompletion >= TALENT_ACTIONS_MIN_COMPLETION;
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [expressedInterest, setExpressedInterest] = useState([]);
  const [interestMessage, setInterestMessage] = useState("");
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  const [sortBy, setSortBy] = useState("bestMatch");
  const [layoutMode, setLayoutMode] = useState("list");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);

  // Backend data state
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
  const handleProfileComplete = () => {
    // Modal already calls onUpdateUser with flattened talent fields
    loadDashboardData();
    setShowProfileModal(false);
  };
  const handleExpressInterest = async () => {
    if (!selectedStartup) return;
    if (!canUsePrimaryTalentActions) {
      toast.info("Complete your profile first", {
        description: `Reach at least ${TALENT_ACTIONS_MIN_COMPLETION}% profile depth to send interest.`,
      });
      setShowProfileModal(true);
      return;
    }
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
    matchedOpportunities.length > 0 ? matchedOpportunities : topMatches;
  const startupRows = useMemo(
    () =>
      displayedMatches.map((startup, index) => {
        const equityRange = getEquityRange(startup);
        const matchScore = Number(startup.match ?? startup.matchScore ?? 0);
        const teamSize = Number(startup.teamSize || 0);
        const normalizedTags = Array.isArray(startup.tags) ? startup.tags : [];
        const normalizedLookingFor = Array.isArray(startup.lookingFor)
          ? startup.lookingFor
          : [];
        const normalizedStartup = {
          ...startup,
          tags: normalizedTags,
          lookingFor: normalizedLookingFor,
          posted: toRelativePosted(startup.postedDate, startup.posted),
        };
        return {
          id: startup.id?.toString() || `${startup.title || "startup"}-${index}`,
          startup: normalizedStartup,
          title: startup.title || "Untitled startup",
          founder: startup.founder || "Founder",
          shortDescription: truncateDescription(startup.description || ""),
          stage: startup.stage || "Unknown stage",
          funding: startup.funding || "Not disclosed",
          commitment: startup.commitment || "Flexible",
          location: startup.location || "Remote",
          teamSize,
          teamSizeBucket: getTeamSizeBucket(teamSize),
          equityRange,
          equityBucket: getEquityBucket(equityRange),
          matchScore: Number.isFinite(matchScore) ? matchScore : 0,
          avatarTone: getAvatarTone(startup.title || "Startup"),
          postedDateValue: startup.postedDate
            ? new Date(startup.postedDate).getTime()
            : 0,
        };
      }),
    [displayedMatches],
  );
  const filterOptions = useMemo(() => {
    const unique = (values) =>
      [...new Set(values.filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      );
    return {
      stage: unique(startupRows.map((row) => row.stage)),
      funding: unique(startupRows.map((row) => row.funding)),
      commitment: unique(startupRows.map((row) => row.commitment)),
      equity: unique(startupRows.map((row) => row.equityBucket)),
      location: unique(startupRows.map((row) => row.location)),
      teamSize: unique(startupRows.map((row) => row.teamSizeBucket)),
    };
  }, [startupRows]);
  const toggleFilter = (groupKey, optionValue) => {
    setFilters((prev) => {
      const existing = prev[groupKey] || [];
      const nextValues = existing.includes(optionValue)
        ? existing.filter((value) => value !== optionValue)
        : [...existing, optionValue];
      return { ...prev, [groupKey]: nextValues };
    });
  };
  const clearFilters = () => setFilters(FILTER_DEFAULTS);
  const activeFilterCount = Object.values(filters).reduce(
    (total, group) => total + group.length,
    0,
  );
  const filteredRows = useMemo(
    () =>
      startupRows.filter((row) => {
        if (filters.stage.length > 0 && !filters.stage.includes(row.stage)) {
          return false;
        }
        if (
          filters.funding.length > 0 &&
          !filters.funding.includes(row.funding)
        ) {
          return false;
        }
        if (
          filters.commitment.length > 0 &&
          !filters.commitment.includes(row.commitment)
        ) {
          return false;
        }
        if (filters.equity.length > 0 && !filters.equity.includes(row.equityBucket)) {
          return false;
        }
        if (filters.location.length > 0 && !filters.location.includes(row.location)) {
          return false;
        }
        if (
          filters.teamSize.length > 0 &&
          !filters.teamSize.includes(row.teamSizeBucket)
        ) {
          return false;
        }
        return true;
      }),
    [startupRows, filters],
  );
  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((left, right) => {
      if (sortBy === "newest") return right.postedDateValue - left.postedDateValue;
      if (sortBy === "equity") {
        return (
          (right.equityRange?.midpoint || -1) - (left.equityRange?.midpoint || -1)
        );
      }
      if (sortBy === "teamSize") return right.teamSize - left.teamSize;
      return right.matchScore - left.matchScore;
    });
    return rows;
  }, [filteredRows, sortBy]);
  const showProfileBanner =
    !profileBannerDismissed && talentCompletion < TALENT_ACTIONS_MIN_COMPLETION;
  const hasRows = sortedRows.length > 0;
  return (
    <div className="space-y-3 p-3">
      {showProfileModal && (
        <ProfileCompletionModal
          role={user.role}
          user={user}
          onUpdateUser={onUpdateUser}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      {showProfileBanner && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-blue-900">
                    Complete your profile
                  </p>
                  <p className="text-[12px] text-blue-800">
                    Reach {TALENT_ACTIONS_MIN_COMPLETION}% profile strength to
                    unlock browsing and applications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileBannerDismissed(true)}
                  className="rounded p-1 text-blue-700 hover:bg-blue-100"
                  aria-label="Dismiss profile completion banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="min-w-[160px] flex-1">
                  <Progress value={talentCompletion} className="h-1.5" />
                </div>
                <span className="text-[12px] font-semibold text-blue-900">
                  {talentCompletion}%
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-[4px] border-blue-300 px-3 text-[12px] hover:border-indigo-500"
                  onClick={() => setShowProfileModal(true)}
                >
                  Continue profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-md border border-border bg-background p-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] text-muted-foreground underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-5">
            {FILTER_GROUPS.map((group) => {
              const groupOptions = filterOptions[group.key] || [];
              return (
                <details key={group.key} open>
                  <summary className="cursor-pointer list-none text-[13px] font-medium uppercase tracking-[0.04em] text-foreground">
                    {group.label}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {groupOptions.length === 0 && (
                      <p className="text-[12px] text-muted-foreground">
                        No options
                      </p>
                    )}
                    {groupOptions.map((option) => {
                      const optionId = `${group.key}-${String(option)
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`;
                      const isChecked = filters[group.key]?.includes(option);
                      return (
                        <div key={optionId} className="flex items-center gap-2">
                          <input
                            id={optionId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter(group.key, option)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={optionId}
                            className="cursor-pointer text-[12px] text-muted-foreground"
                          >
                            {option}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </aside>
        <section className="rounded-md border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
              {sortedRows.length} results
            </p>
            <div className="flex items-center gap-2">
              {isLoading && (
                <span className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                  Refreshing...
                </span>
              )}
              <label
                htmlFor="match-sort"
                className="text-[12px] text-muted-foreground"
              >
                Sort
              </label>
              <select
                id="match-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-8 rounded-[4px] border border-input bg-background px-2 text-[12px]"
              >
                <option value="bestMatch">Best Match</option>
                <option value="newest">Newest</option>
                <option value="equity">Equity %</option>
                <option value="teamSize">Team Size</option>
              </select>
              <div
                role="group"
                aria-label="Layout toggle"
                className="ml-1 flex items-center gap-1 rounded-[4px] border border-border p-1"
              >
                <button
                  type="button"
                  onClick={() => setLayoutMode("list")}
                  className={`rounded p-1 ${layoutMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  aria-label="Show list layout"
                  aria-pressed={layoutMode === "list"}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={`rounded p-1 ${layoutMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  aria-label="Show grid layout"
                  aria-pressed={layoutMode === "grid"}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {isLoading && !hasRows && (
            <div className="px-4 py-8 text-[13px] text-muted-foreground">
              Loading startup matches...
            </div>
          )}
          {!!error && !hasRows && (
            <div className="px-4 py-8 text-[13px] text-red-600">{error}</div>
          )}
          {!isLoading && !error && !hasRows && (
            <div className="space-y-3 px-4 py-8">
              <p className="text-[13px] text-muted-foreground">
                No startups match your selected filters.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-7 rounded-[4px] border-[#D1D5DB] px-3 text-[12px] hover:border-indigo-500"
                onClick={clearFilters}
              >
                Reset filters
              </Button>
            </div>
          )}
          {hasRows && layoutMode === "list" && (
            <ul className="divide-y divide-border">
              {sortedRows.map((row) => (
                <li key={row.id} className="px-4 py-3">
                  <div className="flex items-start gap-3 lg:items-center">
                    <Avatar className="h-8 w-8 rounded-[6px]">
                      <AvatarFallback
                        className={`rounded-[6px] font-mono text-[12px] ${row.avatarTone}`}
                      >
                        {getInitials(row.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-medium">{row.title}</p>
                        <span
                          aria-label={`${row.matchScore}% match score`}
                          className={`inline-flex h-[22px] items-center rounded-[4px] px-2 text-[11px] font-semibold uppercase tracking-[0.03em] ${getMatchStyle(row.matchScore)}`}
                        >
                          {row.matchScore}%
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {row.founder}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {row.shortDescription}
                      </p>
                    </div>
                    <div className="hidden items-center gap-1.5 lg:flex">
                      <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                        {row.stage}
                      </span>
                      <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                        {row.funding}
                      </span>
                      <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                        EQ {row.equityRange?.label || "N/A"}
                      </span>
                      <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                        {row.commitment}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(event) => handleToggleSave(row.startup, event)}
                        disabled={savingItems.has(row.id)}
                        aria-label={`Save ${row.title}`}
                        aria-pressed={isSaved(row.id)}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isSaved(row.id)
                              ? "fill-red-500 text-red-500"
                              : "text-muted-foreground hover:fill-red-500 hover:text-red-500"
                          }`}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 rounded-[4px] border-[#D1D5DB] px-3 text-[12px] hover:border-[#6366F1]"
                        onClick={() => setSelectedStartup(row.startup)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 lg:hidden">
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.stage}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.funding}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      EQ {row.equityRange?.label || "N/A"}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      {row.commitment}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasRows && layoutMode === "grid" && (
            <div className="grid grid-cols-1 gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
              {sortedRows.map((row) => (
                <div key={row.id} className="space-y-3 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-[6px]">
                      <AvatarFallback
                        className={`rounded-[6px] font-mono text-[12px] ${row.avatarTone}`}
                      >
                        {getInitials(row.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-medium">{row.title}</p>
                        <span
                          aria-label={`${row.matchScore}% match score`}
                          className={`inline-flex h-[22px] items-center rounded-[4px] px-2 text-[11px] font-semibold uppercase tracking-[0.03em] ${getMatchStyle(row.matchScore)}`}
                        >
                          {row.matchScore}%
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {row.founder}
                      </p>
                    </div>
                  </div>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {row.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.stage}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.funding}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      EQ {row.equityRange?.label || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(event) => handleToggleSave(row.startup, event)}
                      disabled={savingItems.has(row.id)}
                      aria-label={`Save ${row.title}`}
                      aria-pressed={isSaved(row.id)}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isSaved(row.id)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground hover:fill-red-500 hover:text-red-500"
                        }`}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 rounded-[4px] border-[#D1D5DB] px-3 text-[12px] hover:border-[#6366F1]"
                      onClick={() => setSelectedStartup(row.startup)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
                    {(selectedStartup.tags || []).map((tag, idx) => (
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
                    {(selectedStartup.lookingFor || []).map((role, idx) => (
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
