import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  MapPin,
  Briefcase,
  Clock,
  Target,
  Mail,
  Linkedin,
  Github,
  ExternalLink,
  Building2,
  Award,
  Heart,
} from "lucide-react";
import { Separator } from "./ui/separator";
import { InvitationComposer } from "./invitations/InvitationComposer";
import UserAvatar from "./shared/UserAvatar";
export function TalentProfileModal({
  isOpen,
  onClose,
  talent,
  onInvite,
  priority,
  reasoning,
  currentUser,
}) {
  const [isInvitationComposerOpen, setIsInvitationComposerOpen] =
    React.useState(false);
  if (!talent) return null;
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };
  const handleInvite = () => {
    if (onInvite) {
      onInvite(talent.id);
    }
    setIsInvitationComposerOpen(true);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="sr-only">Talent Profile</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4 pb-4">
          <UserAvatar
            user={talent}
            name={talent.name}
            className="h-16 w-16 shrink-0"
            fallbackClassName="bg-primary/10 text-primary text-body-medium"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h2 className="mb-0.5">{talent.name}</h2>
                <p className="text-body-medium text-primary font-medium">
                  {talent.role}
                </p>
              </div>
              {priority && (
                <Badge
                  variant="outline"
                  className={`text-caption-medium ${getPriorityColor(priority)}`}
                >
                  {priority}
                </Badge>
              )}
            </div>
            {reasoning && (
              <p className="text-body-small text-muted-foreground mb-2">
                {reasoning}
              </p>
            )}
            <div className="flex items-center gap-3 text-body-small text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{talent.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{talent.experience}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{talent.availability || "Available immediately"}</span>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-label-medium font-semibold text-primary">
                {talent.match}% Match
              </span>
            </div>
          </div>
        </div>
        <Separator />
        {talent.bio && (
          <div className="space-y-1.5">
            <h3 className="text-title-small flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              About
            </h3>
            <p className="text-body-small text-muted-foreground leading-relaxed">
              {talent.bio}
            </p>
          </div>
        )}
        <div className="space-y-1.5">
          <h3 className="text-title-small">Skills & Expertise</h3>
          <div className="flex flex-wrap gap-1.5">
            {(talent.allSkills || talent.skills).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="text-caption-medium py-0.5 px-2"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        <Separator />
        {(talent.previousCompanies && talent.previousCompanies.length > 0) ||
        (talent.interestedIndustries &&
          talent.interestedIndustries.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {talent.previousCompanies &&
              talent.previousCompanies.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-title-small flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Previous Experience
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.previousCompanies.map((company) => (
                      <Badge
                        key={company}
                        variant="outline"
                        className="bg-background text-caption-medium py-0.5 px-2"
                      >
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {talent.interestedIndustries &&
              talent.interestedIndustries.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-title-small flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    Interested In
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.interestedIndustries.map((industry) => (
                      <Badge
                        key={industry}
                        variant="outline"
                        className="bg-primary/5 border-primary/20 text-caption-medium py-0.5 px-2"
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : null}
        <Separator />
        <div className="flex flex-wrap gap-2">
          {talent.linkedinUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-caption-large"
              asChild={true}
            >
              <a
                href={talent.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-3.5 h-3.5 mr-1.5" />
                LinkedIn
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
          {talent.githubUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-caption-large"
              asChild={true}
            >
              <a
                href={talent.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-3.5 h-3.5 mr-1.5" />
                GitHub
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
          {talent.portfolioUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-caption-large"
              asChild={true}
            >
              <a
                href={talent.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Portfolio
              </a>
            </Button>
          )}
        </div>
        <Separator />
        <div className="flex gap-3 pt-2">
          <Button
            className="w-full"
            onClick={handleInvite}
            disabled={!talent.available}
          >
            <Mail className="w-4 h-4 mr-2" />
            {talent.available ? "Invite to Team" : "Currently Unavailable"}
          </Button>
        </div>
      </DialogContent>
      {currentUser && (
        <InvitationComposer
          isOpen={isInvitationComposerOpen}
          onClose={() => setIsInvitationComposerOpen(false)}
          talentId={talent.id}
          talentName={talent.name}
          talentRole={talent.role}
          talentEmail={talent.email}
          founderId={currentUser.id}
          founderName={currentUser.name}
          startupName={currentUser.startupName || "My Startup"}
          startupId={currentUser.startupId || currentUser.id}
        />
      )}
    </Dialog>
  );
}
