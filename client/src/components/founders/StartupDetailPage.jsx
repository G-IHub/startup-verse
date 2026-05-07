import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
import * as inboxApi from "../../utils/api/inboxApi";
import { broadcastMessageUpdate } from "../../utils/realtimeSubscriptions";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Users,
  Clock,
  Globe,
  Linkedin,
  Github,
  Mail,
  FileText,
  ExternalLink,
  Heart,
  Share2,
  DollarSign,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Rocket,
} from "lucide-react";

const COMPENSATION_PHILOSOPHIES = {
  "equity-focused": "Equity-Focused (High equity, lower cash)",
  balanced: "Balanced (Mix of equity and cash)",
  "cash-focused": "Cash-Focused (Competitive salary, lower equity)",
};

const SALARY_APPROACHES = {
  deferred: "Deferred (No salary now, equity only)",
  "startup-friendly": "Startup-Friendly (Below market rate)",
  competitive: "Competitive (Market rate)",
};

export function StartupDetailPage({ user, onNavigate, startup: startupProp, startupId = "" }) {
  const [startup, setStartup] = useState(startupProp || null);
  const [loading, setLoading] = useState(Boolean(!startupProp && startupId));
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);

  useEffect(() => {
    if (!startupProp && startupId) {
      fetchStartup(startupId);
      return;
    }
    if (!startupProp) {
      setLoading(false);
    }
    if (startupProp) {
      setStartup(startupProp);
    }
  }, [startupProp, startupId]);

  const fetchStartup = async (id) => {
    try {
      const response = await founderApi.getAllPosts();
      if (response.success && response.posts) {
        const found = response.posts.find((p) => p.id === id);
        if (found) {
          setStartup(found);
        } else {
          toast.error("Startup not found");
        }
      }
    } catch (error) {
      console.error("Error fetching startup:", error);
      toast.error("Failed to load startup details");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInterest = async () => {
    if (!interestMessage.trim()) {
      toast.error("Please write a message to express your interest");
      return;
    }

    if (!startup) return;

    setSendingInterest(true);

    try {
      const talentUserId = String(user._id ?? user.id ?? "");
      const interest = {
        id: `interest_${Date.now()}_${talentUserId}`,
        startupId: startup.id,
        startupTitle: startup.title,
        founderName: startup.founder,
        founderId: startup.founderId,
        talentId: talentUserId,
        talentName: user.name,
        talentArea: user.professionalTitle || undefined,
        talentSkills: user.skills || undefined,
        message: interestMessage,
        sentAt: new Date().toISOString(),
        status: "pending",
        messages: [],
      };

      await inboxApi.sendInterest(interest);

      // Real-time notification to founder
      await broadcastMessageUpdate(null, "new_conversation", {
        type: "interest",
        talentId: talentUserId,
        talentName: user.name,
        founderId: startup.founderId,
        startupId: startup.id,
        startupTitle: startup.title,
        message: `New interest from ${user.name} for ${startup.title}`,
      });

      toast.success(`Your interest has been sent to ${startup.founder}!`);
      setInterestMessage("");
      setShowInterestForm(false);
      setInterestSent(true);
    } catch (error) {
      console.error("Error sending interest:", error);
      toast.error(error.message || "Failed to send interest");
    } finally {
      setSendingInterest(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const shareStartup = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted text-sm">Loading startup details...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-heading mb-2">Startup Not Found</h2>
          <p className="text-text-muted mb-4">The startup you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => onNavigate?.("browse-startups")}>Browse Startups</Button>
        </div>
      </div>
    );
  }

  const isOwnStartup = user?.id === startup.founderId || user?._id === startup.founderId;
  const isTalent = user?.role === "talent";

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Navigation */}
        <Button variant="ghost" onClick={() => onNavigate?.("browse-startups")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Startups
        </Button>

        {/* Header Card */}
        <Card className="surface-card border-surface-border mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Startup Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
                {startup.title?.charAt(0).toUpperCase() || "S"}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-text-heading mb-2">{startup.title}</h1>
                    <p className="text-text-muted">
                      Posted by{" "}
                      <span className="font-medium text-text-heading">{startup.founder}</span>
                      {" "}• {formatDate(startup.postedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={toggleFavorite}>
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={shareStartup}>
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    <Building2 className="w-3.5 h-3.5 mr-1" />
                    {startup.industry}
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <Rocket className="w-3.5 h-3.5 mr-1" />
                    {startup.stage}
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <Briefcase className="w-3.5 h-3.5 mr-1" />
                    {startup.commitment}
                  </Badge>
                  {startup.location && (
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {startup.location}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="surface-card border-surface-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-text-heading">
                  About This Startup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-body whitespace-pre-wrap leading-relaxed">
                  {startup.description}
                </p>
              </CardContent>
            </Card>

            {/* Looking For */}
            <Card className="surface-card border-surface-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Looking For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {startup.lookingFor?.map((role, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {startup.tags && startup.tags.length > 0 && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {startup.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Why Join Us */}
            {startup.offer?.whyJoinUs && startup.offer.whyJoinUs.length > 0 && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Why Join Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {startup.offer.whyJoinUs.map((reason, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-text-body">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            {!isOwnStartup && isTalent && !interestSent && (
              <Card className="surface-card border-surface-border bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-text-heading mb-2">Interested?</h3>
                  <p className="text-sm text-text-body mb-4">
                    Send a message to {startup.founder} expressing your interest in joining this startup.
                  </p>
                  {!showInterestForm ? (
                    <Button
                      onClick={() => setShowInterestForm(true)}
                      className="w-full bg-primary hover:bg-primary-hover"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Express Interest
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        placeholder="Write a brief message about why you're interested..."
                        className="w-full min-h-24 p-3 rounded-md border border-surface-border bg-surface-page text-sm focus:border-primary focus:outline-none resize-none"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowInterestForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendInterest}
                          disabled={sendingInterest}
                          className="flex-1 bg-primary hover:bg-primary-hover"
                        >
                          {sendingInterest ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {interestSent && (
              <Card className="surface-card border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Interest Sent!</h3>
                      <p className="text-sm text-green-700">
                        {startup.founder} will be notified of your interest.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compensation Offer */}
            {startup.offer && startup.offer.compensationPhilosophy && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Compensation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-surface-page rounded-lg p-3">
                    <p className="text-sm text-text-muted mb-1">Philosophy</p>
                    <p className="font-medium text-text-heading">
                      {COMPENSATION_PHILOSOPHIES[startup.offer.compensationPhilosophy]}
                    </p>
                  </div>

                  {startup.offer.equityMin && startup.offer.equityMax && (
                    <div className="bg-surface-page rounded-lg p-3">
                      <p className="text-sm text-text-muted mb-1">Equity Range</p>
                      <p className="font-medium text-text-heading">
                        {startup.offer.equityMin}% - {startup.offer.equityMax}%
                      </p>
                    </div>
                  )}

                  {startup.offer.salaryApproach && (
                    <div className="bg-surface-page rounded-lg p-3">
                      <p className="text-sm text-text-muted mb-1">Salary Approach</p>
                      <p className="font-medium text-text-heading">
                        {SALARY_APPROACHES[startup.offer.salaryApproach]}
                      </p>
                    </div>
                  )}

                  {startup.offer.salaryMin && startup.offer.salaryMax && (
                    <div className="bg-surface-page rounded-lg p-3">
                      <p className="text-sm text-text-muted mb-1">Salary Range</p>
                      <p className="font-medium text-text-heading">
                        ${parseInt(startup.offer.salaryMin).toLocaleString()} - ${
                          parseInt(startup.offer.salaryMax).toLocaleString()
                        }
                      </p>
                    </div>
                  )}

                  {startup.offer.benefits && startup.offer.benefits.length > 0 && (
                    <>
                      <Separator className="border-surface-border" />
                      <div>
                        <p className="text-sm text-text-muted mb-2">Benefits & Perks</p>
                        <div className="flex flex-wrap gap-2">
                          {startup.offer.benefits.map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {startup.offer.customPerks && (
                    <>
                      <Separator className="border-surface-border" />
                      <div>
                        <p className="text-sm text-text-muted mb-1">Additional Perks</p>
                        <p className="text-sm text-text-body">{startup.offer.customPerks}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Links */}
            <Card className="surface-card border-surface-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-text-heading">Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {startup.website && (
                  <a
                    href={startup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-page rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <Globe className="w-5 h-5 text-text-muted group-hover:text-primary" />
                    <span className="flex-1 text-text-body">Website</span>
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                )}
                {startup.linkedinUrl && (
                  <a
                    href={startup.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-page rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <Linkedin className="w-5 h-5 text-text-muted group-hover:text-primary" />
                    <span className="flex-1 text-text-body">LinkedIn</span>
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                )}
                {startup.githubUrl && (
                  <a
                    href={startup.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-page rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <Github className="w-5 h-5 text-text-muted group-hover:text-primary" />
                    <span className="flex-1 text-text-body">GitHub</span>
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                )}
                {startup.pitchDeckUrl && (
                  <a
                    href={startup.pitchDeckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-page rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <FileText className="w-5 h-5 text-text-muted group-hover:text-primary" />
                    <span className="flex-1 text-text-body">Pitch Deck</span>
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                )}
                {startup.contactEmail && (
                  <a
                    href={`mailto:${startup.contactEmail}`}
                    className="flex items-center gap-3 p-3 bg-surface-page rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <Mail className="w-5 h-5 text-text-muted group-hover:text-primary" />
                    <span className="flex-1 text-text-body">{startup.contactEmail}</span>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Posted Info */}
            <Card className="surface-card border-surface-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Clock className="w-4 h-4" />
                  <span>Posted on {formatDate(startup.postedDate)}</span>
                </div>
                {startup.interested > 0 && (
                  <div className="flex items-center gap-2 text-sm text-text-muted mt-2">
                    <Users className="w-4 h-4" />
                    <span>{startup.interested} people interested</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartupDetailPage;
