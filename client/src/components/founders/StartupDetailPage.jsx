import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
import * as inboxApi from "../../utils/api/inboxApi";
import { broadcastMessageUpdate } from "../../utils/realtimeSubscriptions";
import { StartupAvatar } from "./StartupBrandingFields";
import {
  formatEquityRange,
  formatSalaryRange,
  getCompensationCurrencyLabel,
  hasCompensationDetails,
  hasStartupLinks,
  normalizeLookingFor,
  normalizeTags,
  resolveBrandAccent,
} from "../../domains/founder/startupPostDisplay";
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
  Tag,
  Palette,
} from "lucide-react";

function LinkRow({ href, icon: Icon, label, sublabel, external = true }) {
  const className =
    "flex items-center gap-3 rounded-xl border border-surface-border/80 bg-surface-page p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] group";
  const content = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-surface-border">
        <Icon className="h-4 w-4 text-text-muted group-hover:text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-medium text-text-heading">{label}</p>
        {sublabel ? (
          <p className="truncate font-body text-xs text-text-muted">{sublabel}</p>
        ) : null}
      </div>
      {external ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-text-muted" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function TwitterIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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

export function StartupDetailPage({
  user,
  onNavigate,
  startup: startupProp,
  startupId = "",
  previewMode = false,
  onPreviewBack,
}) {
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

  const isOwnStartup =
    !previewMode &&
    (user?.id === startup.founderId || user?._id === startup.founderId);
  const isTalent = user?.role === "talent";
  const showInterestChrome = previewMode || (!isOwnStartup && isTalent);
  const brandAccent = resolveBrandAccent(startup.brandColor);
  const lookingForRoles = normalizeLookingFor(startup.lookingFor);
  const tagList = normalizeTags(startup.tags);
  const whyJoinReasons = (startup.offer?.whyJoinUs || [])
    .map((r) => String(r).trim())
    .filter(Boolean);
  const showCompensation = hasCompensationDetails(startup.offer);
  const showLinks = hasStartupLinks(startup);
  const equityRange = formatEquityRange(startup.offer);
  const salaryRange = formatSalaryRange(startup.offer);
  const compensationCurrencyLabel = getCompensationCurrencyLabel(startup.offer);

  const handleBack = () => {
    if (previewMode && onPreviewBack) {
      onPreviewBack();
      return;
    }
    onNavigate?.("browse-startups");
  };

  const previewToast = () => {
    toast.message("Preview", {
      description: "Talent can use this after your post is published.",
    });
  };

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="max-w-5xl mx-auto px-6 py-8 pb-28">
        {/* Navigation */}
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {previewMode ? "Back to Edit" : "Back to Startups"}
        </Button>

        {previewMode && (
          <div className="mb-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-text-body">
            <span className="font-semibold text-text-heading">Talent preview</span>
            {" — "}
            This is the full listing page talent sees when browsing startups. Save or publish when you are
            ready.
          </div>
        )}
        {/* Header Card */}
        <Card className="surface-card mb-6 overflow-hidden border-surface-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Startup Avatar */}
              <StartupAvatar
                title={startup.title}
                logoUrl={startup.logoUrl || startup.logo}
                brandColor={startup.brandColor}
                size="md"
              />

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-text-heading mb-2">{startup.title}</h1>
                    {startup.tagline ? (
                      <p className="mb-2 text-base font-medium text-primary">
                        {startup.tagline}
                      </p>
                    ) : null}
                    <p className="text-text-muted">
                      Posted by{" "}
                      <span className="font-medium text-text-heading">{startup.founder}</span>
                      {" "}• {formatDate(startup.postedDate)}
                    </p>
                    {brandAccent ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-page px-3 py-1 text-xs text-text-muted ring-1 ring-surface-border">
                        <Palette className="h-3.5 w-3.5" style={{ color: brandAccent }} />
                        <span>Brand color</span>
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: brandAccent }}
                        />
                        <span className="font-mono text-[11px]">{brandAccent}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => (previewMode ? previewToast() : toggleFavorite())}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={shareStartup}
                    >
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
                  {lookingForRoles.length > 0 ? (
                    lookingForRoles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="rounded-full px-4 py-2 text-sm font-medium"
                      >
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted">No roles listed yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {tagList.length > 0 && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tagList.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {whyJoinReasons.length > 0 && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Why Join Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {whyJoinReasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-3">
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
            {!isOwnStartup && showInterestChrome && !interestSent && (
              <Card className="surface-card border-surface-border bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-text-heading mb-2">Interested?</h3>
                  <p className="text-sm text-text-body mb-4">
                    Send a message to {startup.founder} expressing your interest in joining this startup.
                  </p>
                  {previewMode ? (
                    <Button disabled className="w-full opacity-80" variant="secondary">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Express Interest
                    </Button>
                  ) : !showInterestForm ? (
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
                  {previewMode && (
                    <p className="text-xs text-text-muted mt-3">
                      In preview this button is inactive. After you publish, talent can send you a real
                      message from here.
                    </p>
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
            {showCompensation && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Compensation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {startup.offer.compensationPhilosophy ? (
                    <div className="rounded-xl border border-surface-border/80 bg-surface-page p-3">
                      <p className="text-sm text-text-muted mb-1">Philosophy</p>
                      <p className="font-medium text-text-heading">
                        {COMPENSATION_PHILOSOPHIES[startup.offer.compensationPhilosophy]}
                      </p>
                    </div>
                  ) : null}

                  {equityRange ? (
                    <div className="rounded-xl border border-surface-border/80 bg-surface-page p-3">
                      <p className="text-sm text-text-muted mb-1">Equity range</p>
                      <p className="font-medium text-text-heading">{equityRange}</p>
                    </div>
                  ) : null}

                  {startup.offer.salaryApproach ? (
                    <div className="rounded-xl border border-surface-border/80 bg-surface-page p-3">
                      <p className="text-sm text-text-muted mb-1">Salary approach</p>
                      <p className="font-medium text-text-heading">
                        {SALARY_APPROACHES[startup.offer.salaryApproach]}
                      </p>
                    </div>
                  ) : null}

                  {compensationCurrencyLabel ? (
                    <div className="rounded-xl border border-surface-border/80 bg-surface-page p-3">
                      <p className="text-sm text-text-muted mb-1">Currency</p>
                      <p className="font-medium text-text-heading">{compensationCurrencyLabel}</p>
                    </div>
                  ) : null}

                  {salaryRange ? (
                    <div className="rounded-xl border border-surface-border/80 bg-surface-page p-3">
                      <p className="text-sm text-text-muted mb-1">Salary range</p>
                      <p className="font-medium text-text-heading">{salaryRange}</p>
                    </div>
                  ) : null}

                  {startup.offer.benefits?.length > 0 ? (
                    <>
                      <Separator className="border-surface-border" />
                      <div>
                        <p className="text-sm text-text-muted mb-2">Benefits & perks</p>
                        <div className="flex flex-wrap gap-2">
                          {startup.offer.benefits.map((benefit) => (
                            <Badge key={benefit} variant="outline" className="rounded-full text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {startup.offer.customPerks ? (
                    <>
                      <Separator className="border-surface-border" />
                      <div>
                        <p className="text-sm text-text-muted mb-1">Additional perks</p>
                        <p className="text-sm text-text-body whitespace-pre-wrap">
                          {startup.offer.customPerks}
                        </p>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {showLinks && (
              <Card className="surface-card border-surface-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-text-heading">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {startup.website ? (
                    <LinkRow href={startup.website} icon={Globe} label="Website" sublabel={startup.website} />
                  ) : null}
                  {startup.linkedinUrl ? (
                    <LinkRow
                      href={startup.linkedinUrl}
                      icon={Linkedin}
                      label="LinkedIn"
                      sublabel={startup.linkedinUrl}
                    />
                  ) : null}
                  {startup.twitterUrl ? (
                    <LinkRow
                      href={startup.twitterUrl}
                      icon={TwitterIcon}
                      label="Twitter / X"
                      sublabel={startup.twitterUrl}
                    />
                  ) : null}
                  {startup.githubUrl ? (
                    <LinkRow href={startup.githubUrl} icon={Github} label="GitHub" sublabel={startup.githubUrl} />
                  ) : null}
                  {startup.pitchDeckUrl ? (
                    <LinkRow
                      href={startup.pitchDeckUrl}
                      icon={FileText}
                      label="Pitch deck"
                      sublabel={startup.pitchDeckUrl}
                    />
                  ) : null}
                  {startup.contactEmail ? (
                    <LinkRow
                      href={`mailto:${startup.contactEmail}`}
                      icon={Mail}
                      label="Contact email"
                      sublabel={startup.contactEmail}
                      external={false}
                    />
                  ) : null}
                </CardContent>
              </Card>
            )}

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
