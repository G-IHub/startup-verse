/**
 * TEAM MATCHING - Two-Sided Marketplace
 *
 * FOUNDERS see: Available TALENT profiles (people looking to join startups)
 * TALENT see: Startup ideas posted by founders
 * TEAM-MEMBERS: NO ACCESS (already committed to a startup)
 *
 * This prevents conflicts of interest and maintains trust in the platform
 */

import React, { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { Button } from "./ui/button";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import * as founderApi from "../utils/api/founderApi";
import * as inboxApi from "../utils/api/inboxApi";
import { broadcastMessageUpdate } from "../utils/realtimeSubscriptions";
import OfferDisplay from "./OfferDisplay";
import {
  generateSmartTeamRecommendations,
  getTalentMatchesForRoles,
} from "../utils/smartTeamMatching";
import { TALENT_BROWSE_MIN_COMPLETION } from "../constants/talentProfile.js";
import { augmentTalentBrowseFields } from "../utils/talentBrowseNormalize";
import { getTalentBrowseProfileCompletionPercent } from "../utils/talentProfileCompletion.js";
import TeamOnboardingManager from "./compensation/TeamOnboardingManager";
import CompensationSetupWizard from "./compensation/CompensationSetupWizard";
import {
  Users,
  Search,
  Plus,
  Star,
  Sparkles,
  Clock,
  TrendingUp,
  Target,
  MapPin,
  Briefcase,
  CheckCircle2,
  Heart,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  Send,
  Eye,
  DollarSign,
  Code,
  Palette,
  Globe,
  Rocket,
  Mail,
  AlertCircle,
  UserPlus,
  Edit,
} from "lucide-react";
function normalizeTalentProfile(profile) {
  if (!profile) return null;
  if (
    getTalentBrowseProfileCompletionPercent(profile) <
    TALENT_BROWSE_MIN_COMPLETION
  ) {
    return null;
  }
  const enriched = augmentTalentBrowseFields(profile);
  if (!enriched) return null;
  const toArr = (v) => (Array.isArray(v) ? v : []);
  return {
    ...enriched,
    id: String(profile._id || profile.id || ""),
    interests: toArr(enriched.interests),
    skills: toArr(enriched.skills),
    industryPreferences: toArr(enriched.industryPreferences),
    preferredRoles: toArr(enriched.preferredRoles),
    workExperiences: toArr(enriched.workExperiences),
    educationList: toArr(enriched.educationList),
    certifications: toArr(enriched.certifications),
    portfolioItems: toArr(enriched.portfolioItems),
    portfolioLinks: toArr(enriched.portfolioLinks),
  };
}

export default function TeamMatching({ user, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostIdeaOpen, setIsPostIdeaOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [startupIdeas, setStartupIdeas] = useState([]);
  const [availableTalent, setAvailableTalent] = useState([]);
  const [sortBy, setSortBy] = useState("match");
  const [showOnlyWithOffers, setShowOnlyWithOffers] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [recommendedTalent, setRecommendedTalent] = useState([]);
  const [showCompensationManager, setShowCompensationManager] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState([]);
  const [selectedOnboardingTalent, setSelectedOnboardingTalent] =
    useState(null);
  const [showCompensationWizard, setShowCompensationWizard] = useState(false);
  const [postFormData, setPostFormData] = useState({
    title: "",
    description: "",
    industry: "",
    stage: "",
    lookingFor: "",
    location: "",
    commitment: "",
    tags: "",
    // Additional Information
    website: "",
    linkedinUrl: "",
    twitterUrl: "",
    githubUrl: "",
    contactEmail: "",
    pitchDeckUrl: "",
    // Offer fields
    compensationPhilosophy: "",
    equityMin: "",
    equityMax: "",
    salaryApproach: "",
    salaryMin: "",
    salaryMax: "",
    benefits: [],
    whyJoinUs: ["", "", ""],
    customPerks: "",
  });

  // Load data from localStorage on mount
  React.useEffect(() => {
    loadStartupIdeas();
    if (user.role === "founder") {
      loadPendingOnboarding();
    }
    loadTalentProfiles();
  }, [user.role]);

  // Generate smart recommendations for founders
  React.useEffect(() => {
    if (user.role === "founder" && user.profile && user.onboardingComplete) {
      // Generate role recommendations based on founder profile
      const recommendations = generateSmartTeamRecommendations({
        industryFocus: user.profile.industryFocus,
        stage: user.profile.stage,
        targetAudience: user.profile.targetAudience,
        rolesNeeded: user.profile.rolesNeeded,
        teamSize: user.profile.teamSize,
        startupDescription: user.profile.startupDescription,
      });
      setTeamRecommendations(recommendations);

      // Get actual talent matches for recommended roles (top 3 roles)
      const topRoles = recommendations.slice(0, 3).map((r) => r.role);
      const matches = getTalentMatchesForRoles(topRoles, 4); // Get 4 matches max
      setRecommendedTalent(matches);
    }
  }, [user.role, user.profile, user.onboardingComplete, availableTalent]);
  const loadStartupIdeas = () => {
    console.log("🔄 [TeamMatching-Founder] Loading startup ideas...");

    // Load from localStorage immediately for instant UI
    const cachedIdeas = JSON.parse(
      localStorage.getItem("startupverse_startup_posts") || "[]",
    );
    if (cachedIdeas.length > 0) {
      console.log(
        "📦 [TeamMatching-Founder] Loaded from cache:",
        cachedIdeas.length,
        "posts",
      );
      setStartupIdeas(
        cachedIdeas.map((idea) => ({
          ...idea,
          postedDate: new Date(idea.postedDate),
        })),
      );
    } else {
      console.log("⚠️ [TeamMatching-Founder] No cached posts found");
    }

    // Load from backend to sync latest data
    console.log("🌐 [TeamMatching-Founder] Fetching from backend...");
    founderApi
      .getAllPosts()
      .then((response) => {
        console.log("✅ [TeamMatching-Founder] Backend response:", response);
        if (response.success && response.posts) {
          console.log(
            "📊 [TeamMatching-Founder] Received",
            response.posts.length,
            "posts from backend",
          );
          // Update localStorage cache
          localStorage.setItem(
            "startupverse_startup_posts",
            JSON.stringify(response.posts),
          );
          // Update UI with backend data (source of truth)
          setStartupIdeas(
            response.posts.map((idea) => ({
              ...idea,
              postedDate: new Date(idea.postedDate),
            })),
          );
        } else {
          console.log("⚠️ [TeamMatching-Founder] Backend returned no posts");
        }
      })
      .catch((error) => {
        console.error("❌ [TeamMatching-Founder] Backend fetch failed:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
        // Use cached data if backend fails
        if (cachedIdeas.length === 0) {
          console.warn(
            "⚠️ [TeamMatching-Founder] No cached data available and backend failed",
          );
        }
      });
  };
  const loadTalentProfiles = () => {
    console.log("🔍 [TeamMatching] Loading talent profiles...");

    // Load from localStorage first (for immediate display)
    const cachedProfiles = JSON.parse(
      localStorage.getItem("startupverse_talent_profiles") || "[]",
    );
    console.log(
      "📦 [TeamMatching] Cached talent profiles:",
      cachedProfiles.length,
    );

    const normalizedCached = cachedProfiles.map(normalizeTalentProfile).filter(Boolean);

    // If user is founder, sort by match score
    if (user.role === "founder") {
      const founderProfiles = JSON.parse(
        localStorage.getItem("startupverse_founder_profiles") || "[]",
      );
      const myProfile = founderProfiles.find((p) => p.founderId === String(user._id ?? user.id ?? ""));
      if (myProfile) {
        // Calculate match scores and sort
        const scoredProfiles = normalizedCached.map((talent) => ({
          ...talent,
          matchScore: calculateTalentMatchScore(talent, myProfile),
        }));
        scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);
        console.log("✅ [TeamMatching] Profiles sorted by match score");
        setAvailableTalent(scoredProfiles);
      } else {
        console.log(
          "⚠️ [TeamMatching] No founder profile found for user:",
          user.id,
        );
        setAvailableTalent(normalizedCached);
      }
    } else {
      setAvailableTalent(normalizedCached);
    }

    // **NEW: Fetch fresh data from backend**
    console.log("🌐 [TeamMatching] Fetching talent profiles from backend...");
    fetch(
      `${API_BASE_URL}/talent/profiles`,
      defaultOptions,
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ [TeamMatching] Backend talent response:", data);
        const rawProfiles = data.data || data.profiles || [];
        if (data.success && Array.isArray(rawProfiles) && rawProfiles.length > 0) {
          console.log(
            "📊 [TeamMatching] Received",
            rawProfiles.length,
            "profiles from backend",
          );

          const normalized = rawProfiles.map(normalizeTalentProfile).filter(Boolean);

          // Save to localStorage for caching
          localStorage.setItem(
            "startupverse_talent_profiles",
            JSON.stringify(normalized),
          );

          // Sort and display
          if (user.role === "founder") {
            const founderProfiles = JSON.parse(
              localStorage.getItem("startupverse_founder_profiles") || "[]",
            );
            const myProfile = founderProfiles.find(
              (p) => p.founderId === user.id,
            );
            if (myProfile) {
              const scoredProfiles = normalized.map((talent) => ({
                ...talent,
                matchScore: calculateTalentMatchScore(talent, myProfile),
              }));
              scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);
              setAvailableTalent(scoredProfiles);
            } else {
              setAvailableTalent(normalized);
            }
          } else {
            setAvailableTalent(normalized);
          }
        }
      })
      .catch((error) => {
        console.error(
          "❌ [TeamMatching] Failed to fetch talent profiles from backend:",
          error,
        );
        // Keep using cached data if backend fails
      });
  };
  const loadPendingOnboarding = () => {
    // Load accepted invitations that haven't been onboarded yet
    const invitations = JSON.parse(
      localStorage.getItem("startupverse_sent_invitations") || "[]",
    );
    const pending = invitations.filter(
      (inv) =>
        (inv.sentById === user.id || inv.sentBy === user.name) &&
        inv.status === "accepted" &&
        !inv.onboarded,
    );
    setPendingOnboarding(pending);
  };

  // Calculate how well a talent matches founder's needs
  const calculateTalentMatchScore = (talent, founderProfile) => {
    let score = 0;

    // Match based on needed roles (high weight)
    const neededRoles = Array.isArray(founderProfile.neededRoles)
      ? founderProfile.neededRoles
      : [];
    const talentRole = talent.role || talent.professionalTitle || "";
    if (
      neededRoles.length > 0 &&
      neededRoles.some(
        (role) =>
          talentRole.toLowerCase().includes(role.toLowerCase()) ||
          role.toLowerCase().includes(talentRole.toLowerCase()),
      )
    ) {
      score += 40;
    }

    // Match based on interests/industry (medium weight)
    const founderIndustry = founderProfile.industry || "";
    const talentInterests = Array.isArray(talent.interests)
      ? talent.interests
      : Array.isArray(talent.industryPreferences)
        ? talent.industryPreferences
        : [];
    if (
      talentInterests.length > 0 &&
      talentInterests.some(
        (interest) =>
          interest.toLowerCase().includes(founderIndustry.toLowerCase()) ||
          founderIndustry.toLowerCase().includes(interest.toLowerCase()),
      )
    ) {
      score += 30;
    }

    // Availability bonus (low weight)
    if (talent.availability === "Immediately") {
      score += 15;
    } else if (talent.availability?.includes("week")) {
      score += 10;
    }

    // Experience level (low weight)
    const experience = talent.experience || "";
    if (
      experience.includes("7") ||
      experience.includes("8") ||
      experience.includes("9") ||
      experience.includes("10+")
    ) {
      score += 15;
    } else if (
      experience.includes("3") ||
      experience.includes("4") ||
      experience.includes("5")
    ) {
      score += 10;
    }
    return score;
  };

  // Calculate how well a startup matches talent's profile
  const handlePostIdea = () => {
    const missing = [];
    if (!postFormData.title?.trim()) missing.push("Startup Title");
    if (!postFormData.description?.trim()) missing.push("Description");
    if (!postFormData.industry) missing.push("Industry");
    if (!postFormData.stage) missing.push("Stage");
    if (!postFormData.lookingFor?.trim()) missing.push("Looking For (roles)");
    if (!postFormData.commitment) missing.push("Commitment");

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    if (postFormData.description.trim().length < 50) {
      toast.error("Description must be at least 50 characters so talent can evaluate your startup.");
      return;
    }

    // Show preview instead of posting immediately
    setShowPreview(true);
  };
  const handleConfirmPost = async () => {
    // Build offer object from form data if compensationPhilosophy is selected
    let offer = undefined;
    if (postFormData.compensationPhilosophy) {
      offer = {
        compensationPhilosophy: postFormData.compensationPhilosophy,
        equityMin: postFormData.equityMin,
        equityMax: postFormData.equityMax,
        salaryApproach: postFormData.salaryApproach,
        salaryMin: postFormData.salaryMin,
        salaryMax: postFormData.salaryMax,
        benefits: postFormData.benefits,
        whyJoinUs: postFormData.whyJoinUs.filter((r) => r.trim() !== ""),
        ...(postFormData.customPerks && {
          customPerks: postFormData.customPerks,
        }),
      };
    }

    // Check if we're editing an existing post
    const resolvedUserId = String(user._id ?? user.id ?? "");
    if (!resolvedUserId || resolvedUserId === "undefined") {
      toast.error("Session error: could not identify your account. Please log out and log back in.");
      return;
    }
    const existingPost = startupIdeas.find(
      (idea) => idea.founderId === resolvedUserId,
    );
    const ideaData = {
      id: existingPost?.id || Date.now().toString(),
      // Keep existing ID if editing
      title: postFormData.title,
      description: postFormData.description,
      founder: user.name,
      founderId: resolvedUserId,
      founderAvatar: user.profile?.avatar,
      industry: postFormData.industry || "Other",
      stage: postFormData.stage || "Idea Stage",
      lookingFor: postFormData.lookingFor
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r),
      location: postFormData.location || "Remote",
      commitment: postFormData.commitment || "Full-time",
      postedDate: existingPost?.postedDate || new Date(),
      // Keep original date if editing
      interested: existingPost?.interested || 0,
      // Preserve interest count
      tags: postFormData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      offer: offer,
      // Additional Information
      ...(postFormData.website && {
        website: postFormData.website,
      }),
      ...(postFormData.linkedinUrl && {
        linkedinUrl: postFormData.linkedinUrl,
      }),
      ...(postFormData.twitterUrl && {
        twitterUrl: postFormData.twitterUrl,
      }),
      ...(postFormData.githubUrl && {
        githubUrl: postFormData.githubUrl,
      }),
      ...(postFormData.contactEmail && {
        contactEmail: postFormData.contactEmail,
      }),
      ...(postFormData.pitchDeckUrl && {
        pitchDeckUrl: postFormData.pitchDeckUrl,
      }),
    };
    try {
      const savedPost = await founderApi.saveStartupPost(String(user._id ?? user.id), ideaData);
      const canonical = savedPost || ideaData;
      if (isEditingExisting) {
        setStartupIdeas((prev) =>
          prev.map((idea) => (idea.founderId === resolvedUserId ? canonical : idea)),
        );
        toast.success("Your startup post has been updated!");
      } else {
        setStartupIdeas((prev) => [canonical, ...prev]);
        toast.success("Startup posted! Now visible to all talent.");
      }
    } catch (error) {
      console.error("❌ [TeamMatching] Failed to save startup post:", error);
      toast.error(
        error?.message || "Failed to save post. Please try again.",
      );
      return;
    }
    setShowPreview(false);
    setIsPostIdeaOpen(false);
    setIsEditingExisting(false);
    setPostFormData({
      title: "",
      description: "",
      industry: "",
      stage: "",
      lookingFor: "",
      location: "",
      commitment: "",
      tags: "",
      // Additional Information
      website: "",
      linkedinUrl: "",
      twitterUrl: "",
      githubUrl: "",
      contactEmail: "",
      pitchDeckUrl: "",
      // Offer fields
      compensationPhilosophy: "",
      equityMin: "",
      equityMax: "",
      salaryApproach: "",
      salaryMin: "",
      salaryMax: "",
      benefits: [],
      whyJoinUs: ["", "", ""],
      customPerks: "",
    });
    toast.success(
      "🚀 Your startup idea has been posted! Talented people can now discover it.",
    );
  };
  const handleSendInterest = async () => {
    if (!interestMessage.trim()) {
      toast.error("Please write a message to express your interest");
      return;
    }
    if (!selectedIdea) return;
    try {
      console.log("📤 [Talent] Sending interest to startup:", {
        startupTitle: selectedIdea.title,
        founderName: selectedIdea.founder,
        founderId: selectedIdea.founderId,
        selectedIdea: selectedIdea,
      });

      // Validate founderId exists
      if (!selectedIdea.founderId) {
        console.error("❌ Missing founderId in selectedIdea:", selectedIdea);
        toast.error(
          "Cannot send interest: Startup founder information is missing",
        );
        return;
      }

      // Send interest via backend API
      const talentUserId = String(user._id ?? user.id ?? "");
      const interest = {
        id: `interest_${Date.now()}_${talentUserId}`,
        startupId: selectedIdea.id,
        startupTitle: selectedIdea.title,
        founderName: selectedIdea.founder,
        founderId: selectedIdea.founderId,
        talentId: talentUserId,
        talentName: user.name,
        talentArea: user.professionalTitle || undefined,
        // Add talent's professional area
        talentSkills: user.skills || undefined,
        // Add talent's skills
        message: interestMessage,
        sentAt: new Date().toISOString(),
        status: "pending",
        messages: [],
      };
      console.log("📨 Sending interest object:", interest);
      await inboxApi.sendInterest(interest);
      console.log("✅ Interest sent successfully");

      // 🔥 REALTIME: Broadcast to founder that new chat connection is available
      await broadcastMessageUpdate(null, "new_conversation", {
        type: "interest",
        talentId: interest.talentId,
        talentName: interest.talentName,
        founderId: interest.founderId,
        startupId: interest.startupId,
        startupTitle: interest.startupTitle,
        message: `New interest from ${interest.talentName} for ${interest.startupTitle}`,
      });

      toast.success(
        `✉️ Your interest has been sent to ${selectedIdea.founder}! Redirecting to your inbox...`,
      );
      setInterestMessage("");
      setSelectedIdea(null);
      setShowDetailsDialog(false);

      // Navigate to Inbox SENT tab to view sent interest
      if (onNavigate) {
        console.log("🚀 [TeamMatching] Navigating to inbox:sent in 1000ms...");
        // Add delay to ensure backend has processed and saved the interest
        setTimeout(() => {
          console.log('📍 [TeamMatching] Calling onNavigate("inbox:sent")');
          onNavigate("inbox:sent");
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Error sending interest:", error);
      toast.error("Failed to send interest. Please try again.");
    }
  };
  const handleStartOnboarding = (talent) => {
    setSelectedOnboardingTalent(talent);
    setShowCompensationWizard(true);
  };
  const handleCompleteOnboarding = (compensationConfig) => {
    if (!selectedOnboardingTalent) return;

    // Mark the invitation as onboarded
    const invitations = JSON.parse(
      localStorage.getItem("startupverse_sent_invitations") || "[]",
    );
    const updated = invitations.map((inv) =>
      inv.id === selectedOnboardingTalent.id
        ? {
            ...inv,
            onboarded: true,
            compensationConfig,
            onboardedAt: new Date().toISOString(),
          }
        : inv,
    );
    localStorage.setItem(
      "startupverse_sent_invitations",
      JSON.stringify(updated),
    );

    // Create team member record
    const teamMembers = JSON.parse(
      localStorage.getItem("startupverse_team_members") || "[]",
    );
    teamMembers.push({
      id: Date.now().toString(),
      founderId: user.id,
      talentId: selectedOnboardingTalent.talentId,
      talentName: selectedOnboardingTalent.talentName,
      compensationConfig,
      joinedAt: new Date().toISOString(),
      status: "active",
    });
    localStorage.setItem(
      "startupverse_team_members",
      JSON.stringify(teamMembers),
    );
    toast.success(
      `🎉 ${selectedOnboardingTalent.talentName} has been onboarded successfully!`,
    );
    setShowCompensationWizard(false);
    setSelectedOnboardingTalent(null);
    loadPendingOnboarding();
  };
  const viewTalentProfile = (member) => {
    if (!member) return;
    
    // Navigate to the talent profile page with formatted talent data
    if (onNavigate) {
      onNavigate("talent-profile", {
        talent: {
          id: member.id,
          fullName: member.name,
          professionalTitle: member.role,
          location: member.location,
          bio: member.bio,
          skills: member.skills,
          linkedinUrl: member.linkedinUrl,
          githubUrl: member.githubUrl,
          portfolioWebsite: member.portfolioWebsite,
          workExperiences: member.workExperiences,
          educationList: member.educationList,
          certifications: member.certifications,
          portfolioItems: member.portfolioItems,
          availabilityStatus: member.availability,
          preferredCommitment: member.preferredCommitment,
          yearsOfExperience: member.experience,
          email: member.email,
          match: member.matchScore,
          primaryRole: member.role,
          interests: member.interests,
          lookingFor: member.lookingFor,
        }
      });
    }
  };

  // Formatting and icon helper functions
  const formatDate = (date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };
  const getIndustryIcon = (industry) => {
    switch (industry.toLowerCase()) {
      case "healthtech":
        return <Heart className="w-4 h-4" />;
      case "edtech":
        return <Star className="w-4 h-4" />;
      case "fintech":
        return <DollarSign className="w-4 h-4" />;
      case "e-commerce":
        return <Globe className="w-4 h-4" />;
      case "cleantech":
        return <Target className="w-4 h-4" />;
      default:
        return <Rocket className="w-4 h-4" />;
    }
  };
  const getRoleIcon = (role) => {
    if (
      role.toLowerCase().includes("developer") ||
      role.toLowerCase().includes("engineer")
    ) {
      return <Code className="w-4 h-4" />;
    }
    if (role.toLowerCase().includes("designer")) {
      return <Palette className="w-4 h-4" />;
    }
    if (role.toLowerCase().includes("market")) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <Briefcase className="w-4 h-4" />;
  };

  // Apply sorting based on user preference
  const getSortedIdeas = () => {
    // Use only real startup ideas - no fallback to mock data
    const ideas = startupIdeas;
    if (sortBy === "recent") {
      return [...ideas].sort(
        (a, b) => b.postedDate.getTime() - a.postedDate.getTime(),
      );
    }
    // 'match' is default - already sorted by match score
    return ideas;
  };
  const getSortedTalent = () => {
    // Use only real talent profiles - no fallback to mock data
    const talent = availableTalent;
    if (sortBy === "recent") {
      return [...talent].sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
      });
    }
    // 'match' is default
    return talent;
  };

  // Filter ideas or talent based on search query
  const filteredIdeas = getSortedIdeas().filter(
    (idea) =>
      idea.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.tags?.some((tag) =>
        tag?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );
  const filteredTalent = getSortedTalent().filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(member.skills) &&
        member.skills.some((skill) =>
          skill?.toLowerCase().includes(searchQuery.toLowerCase()),
        )) ||
      member.bio?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  console.log(
    "[TeamMatching] 🎨 Rendering - availableTalent:",
    availableTalent.length,
    "filteredTalent:",
    filteredTalent.length,
    "user.role:",
    user.role,
  );
  return (
    <div className="min-h-full bg-surface-page p-2 font-body md:p-3 lg:p-4 space-y-3 md:space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="mb-1 font-heading text-xl font-extrabold text-text-heading md:text-2xl">
            {user.role === "founder"
              ? "Browse Talent"
              : "Browse Startups"}
          </h2>
          <p className="font-body text-xs text-text-body md:text-sm">
            {user.role === "founder"
              ? "Discover talent that can grow into your team"
              : user.role === "team-member"
                ? "Already committed to a startup"
                : "Find your next startup opportunity"}
          </p>
        </div>
        {user.role === "founder" &&
          (() => {
            // Check if founder has an existing post
            const founderPost = startupIdeas.find(
              (idea) => idea.founderId === String(user._id ?? user.id ?? ""),
            );
            const hasExistingPost = !!founderPost;
            return (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    // Navigate to the new dedicated Post Startup page
                    onNavigate?.("post-startup");
                  }}
                  className="rounded-input bg-primary font-body text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover"
                >
                  {hasExistingPost ? (
                    <>
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit Startup Post
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Post Startup Idea
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowCompensationManager(true)}
                  variant="outline"
                  className="rounded-input border border-surface-border bg-surface-card font-body text-sm font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-primary hover:bg-surface-card hover:text-primary"
                >
                  <DollarSign className="w-4 h-4 mr-1.5" />
                  Onboarding & Comp
                </Button>
              </div>
            );
          })()}
      </div>
      {user.role === "team-member" && (
        <Card className="rounded-card border border-surface-border bg-yellow-50/90 shadow-soft dark:bg-yellow-900/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-yellow-700 dark:text-yellow-200" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-1">
                  You're Already Part of a Team!
                </h3>
                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {
                    "Team matching is for founders looking for talent and people looking to join startups. Since you're already committed to "
                  }
                  <strong>{user.companyName || "your current startup"}</strong>,
                  this section isn't available to prevent conflicts of interest.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Focus on executing with your current team and making your
                  startup successful! 🚀
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {(user.role === "founder" || user.role === "talent") && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder={
                  user.role === "founder"
                    ? "Search talent..."
                    : "Search startups..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-input border-[1.5px] border-surface-border bg-surface-card pl-9 font-body text-sm text-text-heading placeholder:text-text-muted transition-shadow duration-200 ease-in-out focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(58,90,254,0.10)] focus-visible:ring-0"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm font-medium text-text-heading transition-colors duration-200 ease-in-out hover:border-primary sm:w-40 [&_svg]:text-text-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user.role === "founder" ? (
            <>
              {pendingOnboarding.length > 0 && (
                <div className="mb-6">
                  <Card className="rounded-card border border-surface-border bg-gradient-to-br from-green-50 to-emerald-50 shadow-soft dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-green-600" />
                          <CardTitle className="text-lg">
                            Pending Onboarding
                          </CardTitle>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          {pendingOnboarding.length}{" "}
                          {pendingOnboarding.length === 1 ? "person" : "people"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        These talents accepted your invitation and are ready to
                        be onboarded
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pendingOnboarding.map((talent) => (
                          <Card
                            key={talent.id}
                            className="rounded-card border border-surface-border bg-surface-card shadow-soft dark:border-surface-border"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                      {talent.talentName?.substring(0, 2) ||
                                        "??"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold text-sm">
                                      {talent.talentName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {"Accepted "}
                                      {new Date(
                                        talent.respondedAt || talent.sentAt,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              </div>
                              {talent.response && (
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2 italic">
                                  "{talent.response}"
                                </p>
                              )}
                              <Button
                                onClick={() => handleStartOnboarding(talent)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                              >
                                <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                                Onboard Team
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {teamRecommendations.length > 0 &&
                recommendedTalent.length > 0 && (
                  <div className="mb-6">
                    <Card className="rounded-card border border-surface-border bg-gradient-to-br from-primary/5 to-primary/10 shadow-soft">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">
                              Recommended for You
                            </CardTitle>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Smart Match
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {"Based on your "}
                          {user.profile?.industryFocus}
                          {" startup at "}
                          {user.profile?.stage}
                          {" stage"}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-orange-600" />
                            Key Roles You Need
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {teamRecommendations.slice(0, 3).map((rec) => (
                              <div
                                key={rec.id}
                                className="rounded-input bg-surface-page p-3 shadow-soft"
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-sm">
                                    {rec.role}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor:
                                        rec.priority === "critical"
                                          ? "#EF4444"
                                          : rec.priority === "high"
                                            ? "#F59E0B"
                                            : "#10B981",
                                      color:
                                        rec.priority === "critical"
                                          ? "#EF4444"
                                          : rec.priority === "high"
                                            ? "#F59E0B"
                                            : "#10B981",
                                    }}
                                  >
                                    {rec.priority === "critical"
                                      ? "🔴 Critical"
                                      : rec.priority === "high"
                                        ? "🟠 High"
                                        : "🟢 Medium"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {rec.reasoning}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-600" />
                            Top Matches
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recommendedTalent.map((member) => (
                              <Card
                                key={member.id}
                                className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
                              >
                                <CardContent className="p-4">
                                  {member.matchScore && (
                                    <Badge
                                      className="absolute top-3 right-3 text-white border-0 text-xs font-semibold px-2 py-0.5 bg-gradient-to-r from-primary to-primary/90 shadow-md"
                                    >
                                      <Star className="w-3 h-3 mr-1 fill-white" />
                                      {member.matchScore}% Match
                                    </Badge>
                                  )}
                                  <div className="flex items-start gap-3 mb-3">
                                    <Avatar className="w-11 h-11 ring-2 ring-slate-100 ring-offset-1.5 transition-transform duration-300 group-hover:scale-105">
                                      <AvatarImage src={member.avatar} />
                                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                                        {member.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                                        {member.name || "Unknown"}
                                      </h3>
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                        {getRoleIcon(member.role || "")}
                                        <span className="truncate">
                                          {member.role || "Role not specified"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                                    {member.bio || "No bio provided"}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {(Array.isArray(member.skills)
                                      ? member.skills
                                      : []
                                    )
                                      .slice(0, 3)
                                      .map((skill) => (
                                        <span
                                          key={skill}
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    {(Array.isArray(member.skills)
                                      ? member.skills
                                      : []
                                    ).length > 3 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200/60">
                                        +{(Array.isArray(member.skills)
                                          ? member.skills
                                          : []).length - 3}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full text-xs bg-primary hover:bg-primary/90 text-white font-medium"
                                    onClick={() => viewTalentProfile(member)}
                                  >
                                    View Profile
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              {(!user.onboardingComplete || !user.profile) && (
                <Card className="mb-4 rounded-card border border-surface-border bg-orange-50/50 shadow-soft dark:bg-orange-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-orange-900 dark:text-orange-100">
                          Complete your profile to get smart recommendations
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Tell us about your startup to see talent
                          recommendations tailored to your needs.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="pt-6">
                <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-text-heading">
                  <Search className="h-4 w-4 text-primary" />
                  Browse Talent
                </h3>
                {filteredTalent.length === 0 ? (
                  <Card className="rounded-card border-0 bg-surface-card shadow-soft">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="mb-4 h-16 w-16 text-surface-border" />
                      <h3 className="mb-2 font-heading text-lg font-semibold text-text-heading">
                        No talent profiles yet
                      </h3>
                      <p className="max-w-md text-center font-body text-sm text-text-muted">
                        Check back soon! Talented people are joining
                        StartupVerse every day.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTalent.map((member) => (
                      <Card 
                        key={member.id} 
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1"
                      >
                        {/* Match Score Badge - Premium Style */}
                        {member.matchScore && member.matchScore >= 40 && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge
                              className={`text-white border-0 font-semibold text-xs px-2.5 py-1 shadow-lg ${
                                member.matchScore >= 80
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                  : member.matchScore >= 60
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                    : "bg-gradient-to-r from-slate-500 to-slate-600"
                              }`}
                            >
                              <Star className="w-3 h-3 mr-1 fill-white" />
                              {member.matchScore}% Match
                            </Badge>
                          </div>
                        )}

                        <CardContent className="p-0">
                          {/* Header Section with Avatar */}
                          <div className="p-5 pb-4">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-14 h-14 ring-2 ring-slate-100 ring-offset-2 transition-transform duration-300 group-hover:scale-105">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-lg">
                                  {member.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <h3 className="font-semibold text-slate-900 text-lg leading-tight truncate">
                                  {member.name || "Unknown"}
                                </h3>
                                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                  {getRoleIcon(member.role || "")}
                                  <span className="truncate">
                                    {member.role || "Role not specified"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bio Section */}
                          <div className="px-5 pb-4">
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              {member.bio || "No bio provided"}
                            </p>
                          </div>

                          {/* Skills Section - Premium Tags */}
                          <div className="px-5 pb-4">
                            <div className="flex flex-wrap gap-1.5">
                              {(Array.isArray(member.skills) ? member.skills : [])
                                .slice(0, 4)
                                .map((skill) => (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {(Array.isArray(member.skills) ? member.skills : []).length > 4 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200/60">
                                  +{(Array.isArray(member.skills) ? member.skills : []).length - 4}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info Grid */}
                          <div className="px-5 pb-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{member.location || "Remote"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{member.experience || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Availability & Interests */}
                          <div className="px-5 pb-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {member.availability ? (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs font-medium ${
                                      member.availability.toLowerCase().includes("full") 
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : member.availability.toLowerCase().includes("part")
                                          ? "border-amber-200 bg-amber-50 text-amber-700"
                                          : "border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                      member.availability.toLowerCase().includes("full")
                                        ? "bg-emerald-500"
                                        : member.availability.toLowerCase().includes("part")
                                          ? "bg-amber-500"
                                          : "bg-slate-400"
                                    }`} />
                                    {member.availability}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs font-medium border-slate-200 bg-slate-50 text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-400" />
                                    Unknown
                                  </Badge>
                                )}
                              </div>
                              
                              {(member.interests || []).length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                                  <span>{member.interests.length} interests</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="px-5 pb-5 pt-0">
                            <Button
                              size="default"
                              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white font-medium shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                              onClick={() => viewTalentProfile(member)}
                            >
                              View Full Profile
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : // TALENT SEE: Startup Ideas - this section will be rendered separately below
          null}
          {user.role === "talent" && (
            <div className="space-y-3">
              {filteredIdeas.length === 0 ? (
                <Card className="rounded-card border-0 bg-surface-card shadow-soft transition-shadow duration-200 ease-in-out">
                  <CardContent className="p-4 text-center">
                    <Rocket className="w-8 h-8 mx-auto mb-2 text-accent" />
                    <p className="font-heading text-sm font-semibold text-text-heading mb-1">
                      No startup ideas found
                    </p>
                    <p className="font-body text-xs text-text-muted">
                      Check back soon! Founders post new opportunities every
                      day.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredIdeas.map((idea) => (
                    <Card key={idea.id} className="flex flex-col rounded-card border border-surface-border bg-surface-card shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={idea.founderAvatar} />
                            <AvatarFallback>
                              {idea.founder.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="mb-0.5 truncate">{idea.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{idea.founder}</span>
                              <span>•</span>
                              <span>{formatDate(idea.postedDate)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {idea.description}
                        </p>
                        {idea.offer && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {idea.offer.equityMin && idea.offer.equityMax && (
                              <div className="flex items-center gap-2 flex-1">
                                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">
                                    Equity
                                  </p>
                                  <p className="font-bold text-primary">
                                    {idea.offer.equityMin}
                                    {"% - "}
                                    {idea.offer.equityMax}%
                                  </p>
                                </div>
                              </div>
                            )}
                            {idea.offer.salaryApproach && (
                              <div className="flex items-center gap-2 flex-1">
                                <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">
                                    Salary
                                  </p>
                                  <p className="font-medium truncate">
                                    {idea.offer.salaryApproach === "deferred" &&
                                      "Deferred"}
                                    {idea.offer.salaryApproach ===
                                      "startup-friendly" &&
                                      `$${idea.offer.salaryMin?.toLocaleString()} - $${idea.offer.salaryMax?.toLocaleString()}`}
                                    {idea.offer.salaryApproach ===
                                      "competitive" &&
                                      `$${idea.offer.salaryMin?.toLocaleString()} - $${idea.offer.salaryMax?.toLocaleString()}`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {idea.industry}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {idea.stage}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2 pt-3 border-t mt-auto">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // Navigate to the new dedicated Startup Detail page
                              onNavigate?.("startup-detail", { startup: idea });
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      <Dialog
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          if (!open) {
            setSelectedIdea(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <ScrollArea className="max-h-[80vh]">
            {selectedIdea && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedIdea.title}</DialogTitle>
                  <DialogDescription>
                    {"Posted by "}
                    {selectedIdea.founder}
                    {" • "}
                    {formatDate(selectedIdea.postedDate)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedIdea.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="text-sm font-medium">
                        {selectedIdea.industry}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stage</p>
                      <p className="text-sm font-medium">
                        {selectedIdea.stage}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">
                        {selectedIdea.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Commitment
                      </p>
                      <p className="text-sm font-medium">
                        {selectedIdea.commitment}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Looking For</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.lookingFor.map((role) => (
                        <Badge key={role}>{role}</Badge>
                      ))}
                    </div>
                  </div>
                  {(selectedIdea.website ||
                    selectedIdea.linkedinUrl ||
                    selectedIdea.twitterUrl ||
                    selectedIdea.githubUrl ||
                    selectedIdea.contactEmail ||
                    selectedIdea.pitchDeckUrl) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">
                        Connect & Learn More
                      </h4>
                      <div className="space-y-2">
                        {selectedIdea.website && (
                          <a
                            href={selectedIdea.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Globe className="w-4 h-4" />
                            <span>Visit Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {selectedIdea.linkedinUrl && (
                          <a
                            href={selectedIdea.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {selectedIdea.twitterUrl && (
                          <a
                            href={selectedIdea.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Twitter/X</span>
                          </a>
                        )}
                        {selectedIdea.githubUrl && (
                          <a
                            href={selectedIdea.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Code className="w-4 h-4" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {selectedIdea.contactEmail && (
                          <a
                            href={`mailto:${selectedIdea.contactEmail}`}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Mail className="w-4 h-4" />
                            <span>{selectedIdea.contactEmail}</span>
                          </a>
                        )}
                        {selectedIdea.pitchDeckUrl && (
                          <a
                            href={selectedIdea.pitchDeckUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Rocket className="w-4 h-4" />
                            <span>View Pitch Deck</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedIdea.offer && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Compensation Offer
                      </h4>
                      <OfferDisplay offer={selectedIdea.offer} />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="interest-message">Your Message</Label>
                    <Textarea
                      id="interest-message"
                      placeholder="Tell the founder why you're interested in joining their startup..."
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleSendInterest}
                      disabled={!interestMessage.trim()}
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Interest
                    </Button>
                  </div>
                </div>
              </>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={isPostIdeaOpen} onOpenChange={setIsPostIdeaOpen}>
        <DialogContent className="max-w-3xl flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {isEditingExisting
                ? "Edit Your Startup Post"
                : "Post Your Startup Idea"}
            </DialogTitle>
            <DialogDescription>
              {isEditingExisting
                ? "Update your startup post to keep talent informed about your latest opportunities."
                : "Share your startup vision and attract talented co-founders and early team members."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4 mt-2 pb-2">
              <p className="text-xs text-muted-foreground"><span className="text-red-500">*</span> Required fields</p>
              <div>
                <Label htmlFor="title">Startup Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g., AI-Powered Healthcare Platform"
                  value={postFormData.title}
                  onChange={(e) =>
                    setPostFormData({
                      ...postFormData,
                      title: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Describe your startup idea, the problem you solve, your traction so far, and why someone should join you. Min 50 characters."
                  value={postFormData.description}
                  onChange={(e) =>
                    setPostFormData({
                      ...postFormData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">{postFormData.description.length}/5000 — min 50 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry <span className="text-red-500">*</span></Label>
                  <select
                    id="industry"
                    value={postFormData.industry}
                    onChange={(e) => setPostFormData({ ...postFormData, industry: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select industry</option>
                    <option value="HealthTech">HealthTech</option>
                    <option value="EdTech">EdTech</option>
                    <option value="FinTech">FinTech</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="CleanTech">CleanTech</option>
                    <option value="SaaS">SaaS</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="stage">Stage <span className="text-red-500">*</span></Label>
                  <select
                    id="stage"
                    value={postFormData.stage}
                    onChange={(e) => setPostFormData({ ...postFormData, stage: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select stage</option>
                    <option value="Idea Stage">Idea Stage</option>
                    <option value="MVP Development">MVP Development</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="lookingFor">
                  Looking For <span className="text-red-500">*</span> <span className="font-normal text-muted-foreground">(comma-separated roles)</span>
                </Label>
                <Input
                  id="lookingFor"
                  placeholder="e.g., Full-Stack Developer, UX Designer, Growth Marketer"
                  value={postFormData.lookingFor}
                  onChange={(e) =>
                    setPostFormData({
                      ...postFormData,
                      lookingFor: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location <span className="text-muted-foreground font-normal text-xs">(e.g. Remote)</span></Label>
                  <Input
                    id="location"
                    placeholder="e.g., Remote, San Francisco, etc."
                    value={postFormData.location}
                    onChange={(e) =>
                      setPostFormData({
                        ...postFormData,
                        location: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="commitment">Commitment <span className="text-red-500">*</span></Label>
                  <select
                    id="commitment"
                    value={postFormData.commitment}
                    onChange={(e) => setPostFormData({ ...postFormData, commitment: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select commitment</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., React, Machine Learning, Healthcare"
                  value={postFormData.tags}
                  onChange={(e) =>
                    setPostFormData({
                      ...postFormData,
                      tags: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">
                  Additional Information (Optional)
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Help talents learn more about your startup
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourstartup.com"
                      value={postFormData.website}
                      onChange={(e) =>
                        setPostFormData({
                          ...postFormData,
                          website: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/company/..."
                        value={postFormData.linkedinUrl}
                        onChange={(e) =>
                          setPostFormData({
                            ...postFormData,
                            linkedinUrl: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitterUrl">Twitter/X</Label>
                      <Input
                        id="twitterUrl"
                        type="url"
                        placeholder="https://twitter.com/..."
                        value={postFormData.twitterUrl}
                        onChange={(e) =>
                          setPostFormData({
                            ...postFormData,
                            twitterUrl: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="githubUrl">GitHub</Label>
                      <Input
                        id="githubUrl"
                        type="url"
                        placeholder="https://github.com/..."
                        value={postFormData.githubUrl}
                        onChange={(e) =>
                          setPostFormData({
                            ...postFormData,
                            githubUrl: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="founder@startup.com"
                        value={postFormData.contactEmail}
                        onChange={(e) =>
                          setPostFormData({
                            ...postFormData,
                            contactEmail: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pitchDeckUrl">
                      Pitch Deck URL (Optional)
                    </Label>
                    <Input
                      id="pitchDeckUrl"
                      type="url"
                      placeholder="https://docsend.com/... or Google Drive link"
                      value={postFormData.pitchDeckUrl}
                      onChange={(e) =>
                        setPostFormData({
                          ...postFormData,
                          pitchDeckUrl: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Share your pitch deck to give talents deeper insights
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Compensation Offer (Optional)
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Attract top talent by being transparent about compensation
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="compensationPhilosophy">
                      Compensation Philosophy
                    </Label>
                    <select
                      id="compensationPhilosophy"
                      value={postFormData.compensationPhilosophy}
                      onChange={(e) => setPostFormData({ ...postFormData, compensationPhilosophy: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select approach</option>
                      <option value="equity-focused">Equity-Focused (High equity, lower cash)</option>
                      <option value="balanced">Balanced (Mix of equity and cash)</option>
                      <option value="cash-focused">Cash-Focused (Competitive salary, lower equity)</option>
                    </select>
                  </div>
                  {postFormData.compensationPhilosophy && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="equityMin">
                            Equity Range - Min %
                          </Label>
                          <Input
                            id="equityMin"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 0.5"
                            value={postFormData.equityMin}
                            onChange={(e) =>
                              setPostFormData({
                                ...postFormData,
                                equityMin: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="equityMax">
                            Equity Range - Max %
                          </Label>
                          <Input
                            id="equityMax"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 2.0"
                            value={postFormData.equityMax}
                            onChange={(e) =>
                              setPostFormData({
                                ...postFormData,
                                equityMax: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="salaryApproach">Salary Approach</Label>
                        <select
                          id="salaryApproach"
                          value={postFormData.salaryApproach}
                          onChange={(e) => setPostFormData({ ...postFormData, salaryApproach: e.target.value })}
                          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Select approach</option>
                          <option value="deferred">Deferred (No salary now, equity only)</option>
                          <option value="startup-friendly">Startup-Friendly (Below market rate)</option>
                          <option value="competitive">Competitive (Market rate)</option>
                        </select>
                      </div>
                      {postFormData.salaryApproach !== "deferred" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="salaryMin">Salary Min ($)</Label>
                            <Input
                              id="salaryMin"
                              type="number"
                              placeholder="e.g., 80000"
                              value={postFormData.salaryMin}
                              onChange={(e) =>
                                setPostFormData({
                                  ...postFormData,
                                  salaryMin: e.target.value,
                                })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="salaryMax">Salary Max ($)</Label>
                            <Input
                              id="salaryMax"
                              type="number"
                              placeholder="e.g., 120000"
                              value={postFormData.salaryMax}
                              onChange={(e) =>
                                setPostFormData({
                                  ...postFormData,
                                  salaryMax: e.target.value,
                                })
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Benefits & Perks</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {[
                            "Remote-first",
                            "Flexible hours",
                            "Health insurance",
                            "Learning budget",
                            "Latest tech & tools",
                            "Unlimited PTO",
                          ].map((benefit) => (
                            <div
                              key={benefit}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={benefit}
                                checked={postFormData.benefits.includes(
                                  benefit,
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPostFormData({
                                      ...postFormData,
                                      benefits: [
                                        ...postFormData.benefits,
                                        benefit,
                                      ],
                                    });
                                  } else {
                                    setPostFormData({
                                      ...postFormData,
                                      benefits: postFormData.benefits.filter(
                                        (b) => b !== benefit,
                                      ),
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor={benefit}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {benefit}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Why Join Us (3 compelling reasons)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          What makes your startup unique and exciting?
                        </p>
                        <div className="space-y-2">
                          {[0, 1, 2].map((index) => (
                            <Input
                              key={index}
                              placeholder={`Reason ${index + 1}`}
                              value={postFormData.whyJoinUs[index]}
                              onChange={(e) => {
                                const newReasons = [...postFormData.whyJoinUs];
                                newReasons[index] = e.target.value;
                                setPostFormData({
                                  ...postFormData,
                                  whyJoinUs: newReasons,
                                });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="customPerks">
                          Additional Perks (Optional)
                        </Label>
                        <Textarea
                          id="customPerks"
                          placeholder="Any other perks or benefits you want to highlight..."
                          value={postFormData.customPerks}
                          onChange={(e) =>
                            setPostFormData({
                              ...postFormData,
                              customPerks: e.target.value,
                            })
                          }
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsPostIdeaOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handlePostIdea} className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Preview Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {selectedIdea
                  ? "Your Startup Post"
                  : "Preview Your Startup Post"}
              </DialogTitle>
              <DialogDescription>
                {selectedIdea
                  ? "This is how your post currently appears to talent on the Team Matching page."
                  : "This is how your post will appear to talent on the Team Matching page."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <Card className="rounded-card border border-surface-border bg-surface-card shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-base">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {selectedIdea
                            ? selectedIdea.title
                            : postFormData.title || "Your Startup Title"}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{user.name}</span>
                          <span>•</span>
                          <span>
                            {selectedIdea
                              ? selectedIdea.industry
                              : postFormData.industry || "Industry"}
                          </span>
                          <span>•</span>
                          <span>
                            {selectedIdea
                              ? selectedIdea.stage
                              : postFormData.stage || "Stage"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedIdea
                        ? new Date(selectedIdea.postedDate).toLocaleDateString()
                        : "Just now"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    {selectedIdea
                      ? selectedIdea.description
                      : postFormData.description ||
                        "Your startup description will appear here..."}
                  </p>
                  {(selectedIdea?.lookingFor || postFormData.lookingFor) && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Target className="w-4 h-4" />
                        Looking For
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedIdea
                          ? selectedIdea.lookingFor.map((role, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-primary/5"
                              >
                                {role}
                              </Badge>
                            ))
                          : postFormData.lookingFor.split(",").map(
                              (role, idx) =>
                                role.trim() && (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-primary/5"
                                  >
                                    {role.trim()}
                                  </Badge>
                                ),
                            )}
                      </div>
                    </div>
                  )}
                  {(selectedIdea?.offer ||
                    postFormData.compensationPhilosophy) && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        Compensation Offer
                      </h4>
                      <OfferDisplay
                        offer={
                          selectedIdea?.offer || {
                            compensationPhilosophy:
                              postFormData.compensationPhilosophy,
                            equityMin: postFormData.equityMin,
                            equityMax: postFormData.equityMax,
                            salaryApproach: postFormData.salaryApproach,
                            salaryMin: postFormData.salaryMin,
                            salaryMax: postFormData.salaryMax,
                            benefits: postFormData.benefits,
                            whyJoinUs: postFormData.whyJoinUs.filter(
                              (r) => r.trim() !== "",
                            ),
                            ...(postFormData.customPerks && {
                              customPerks: postFormData.customPerks,
                            }),
                          }
                        }
                        compact={true}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {selectedIdea
                          ? selectedIdea.location
                          : postFormData.location || "Remote"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>
                        {selectedIdea
                          ? selectedIdea.commitment
                          : postFormData.commitment || "Full-time"}
                      </span>
                    </div>
                    {(selectedIdea?.tags || postFormData.tags) &&
                      (selectedIdea
                        ? selectedIdea.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs py-0"
                            >
                              {tag}
                            </Badge>
                          ))
                        : postFormData.tags.split(",").map(
                            (tag, idx) =>
                              tag.trim() && (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs py-0"
                                >
                                  {tag.trim()}
                                </Badge>
                              ),
                          ))}
                  </div>
                  {(selectedIdea?.website ||
                    postFormData.website ||
                    selectedIdea?.linkedinUrl ||
                    postFormData.linkedinUrl ||
                    selectedIdea?.twitterUrl ||
                    postFormData.twitterUrl ||
                    selectedIdea?.githubUrl ||
                    postFormData.githubUrl ||
                    selectedIdea?.contactEmail ||
                    postFormData.contactEmail ||
                    selectedIdea?.pitchDeckUrl ||
                    postFormData.pitchDeckUrl) && (
                    <div className="pt-3 border-t space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        Additional Information
                      </h4>
                      <div className="space-y-2">
                        {(selectedIdea?.website || postFormData.website) && (
                          <a
                            href={selectedIdea?.website || postFormData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Globe className="w-4 h-4" />
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {(selectedIdea?.linkedinUrl ||
                          postFormData.linkedinUrl) && (
                          <a
                            href={
                              selectedIdea?.linkedinUrl ||
                              postFormData.linkedinUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Users className="w-4 h-4" />
                            <span>LinkedIn</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {(selectedIdea?.twitterUrl ||
                          postFormData.twitterUrl) && (
                          <a
                            href={
                              selectedIdea?.twitterUrl ||
                              postFormData.twitterUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Twitter/X</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {(selectedIdea?.githubUrl ||
                          postFormData.githubUrl) && (
                          <a
                            href={
                              selectedIdea?.githubUrl || postFormData.githubUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Code className="w-4 h-4" />
                            <span>GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {(selectedIdea?.contactEmail ||
                          postFormData.contactEmail) && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4" />
                            <span>
                              {selectedIdea?.contactEmail ||
                                postFormData.contactEmail}
                            </span>
                          </div>
                        )}
                        {(selectedIdea?.pitchDeckUrl ||
                          postFormData.pitchDeckUrl) && (
                          <a
                            href={
                              selectedIdea?.pitchDeckUrl ||
                              postFormData.pitchDeckUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Rocket className="w-4 h-4" />
                            <span>View Pitch Deck</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button disabled={true} className="flex-1 text-sm h-9">
                      <Heart className="w-4 h-4 mr-1.5" />
                      Express Interest
                    </Button>
                    <Button
                      disabled={true}
                      variant="outline"
                      className="text-sm h-9"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-2 pt-4 border-t">
                {selectedIdea ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPreview(false);
                        setSelectedIdea(null);
                      }}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        // Load post data into form for editing
                        const post = selectedIdea;
                        setIsEditingExisting(true);
                        setPostFormData({
                          title: post.title,
                          description: post.description,
                          industry: post.industry || "",
                          stage: post.stage || "",
                          lookingFor: post.lookingFor?.join(", ") || "",
                          location: post.location || "",
                          commitment: post.commitment || "",
                          tags: post.tags?.join(", ") || "",
                          website: post.website || "",
                          linkedinUrl: post.linkedinUrl || "",
                          twitterUrl: post.twitterUrl || "",
                          githubUrl: post.githubUrl || "",
                          contactEmail: post.contactEmail || "",
                          pitchDeckUrl: post.pitchDeckUrl || "",
                          compensationPhilosophy:
                            post.offer?.compensationPhilosophy || "",
                          equityMin: post.offer?.equityMin || "",
                          equityMax: post.offer?.equityMax || "",
                          salaryApproach: post.offer?.salaryApproach || "",
                          salaryMin: post.offer?.salaryMin || "",
                          salaryMax: post.offer?.salaryMax || "",
                          benefits: post.offer?.benefits || [],
                          whyJoinUs: post.offer?.whyJoinUs || ["", "", ""],
                          customPerks: post.offer?.customPerks || "",
                        });
                        setShowPreview(false);
                        setSelectedIdea(null);
                        setIsPostIdeaOpen(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(false)}
                      className="flex-1"
                    >
                      <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                      Back to Edit
                    </Button>
                    <Button
                      onClick={handleConfirmPost}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isEditingExisting ? "Update Post" : "Post Now"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {showCompensationManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
          <div className="sv-modal-panel flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] border-0 bg-white shadow-modal">
            <div className="flex items-center justify-between border-b border-[#e2e4f0] p-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Team Onboarding & Compensation
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompensationManager(false)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <TeamOnboardingManager user={user} />
            </div>
          </div>
        </div>
      )}
      {selectedOnboardingTalent && (
        <CompensationSetupWizard
          isOpen={showCompensationWizard}
          onClose={() => {
            setShowCompensationWizard(false);
            setSelectedOnboardingTalent(null);
          }}
          teamMemberName={selectedOnboardingTalent.talentName}
          teamMemberId={selectedOnboardingTalent.talentId}
          founderId={user.id}
          startupId={user.startupId || user.id}
          onComplete={handleCompleteOnboarding}
        />
      )}
    </div>
  );
}
